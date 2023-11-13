import type { Jsonable } from '@slangroom/shared';
import type { Ast } from '@slangroom/core';

export type PluginMapKey = {
	phrase: string;
	params?: string[];
	openconnect?: 'open' | 'connect';
};

export class DuplicatePluginError extends Error {
	constructor({ openconnect, params, phrase }: PluginMapKey) {
		super(
			`duplicated plugin with key: openconnect=${openconnect ?? ''} params=${[
				...(params ?? []),
			].join(', ')} phrase="${phrase}"`
		);
		this.name = 'DubplicatePluginError';
	}
}

export class PluginMap {
	#store: [PluginMapKey, PluginExecutor][] = [];

	#index(their: PluginMapKey) {
		return this.#store.findIndex(([our]) => {
			const openconn = their.openconnect === our.openconnect;
			const params =
				their.params?.length === our.params?.length &&
				(their.params ?? []).every((v, i) => v === our.params?.[i]);
			const phrase = their.phrase === our.phrase;
			return openconn && params && phrase;
		});
	}

	forEach(cb: (value: [PluginMapKey, PluginExecutor]) => void) {
		this.#store.forEach(cb);
	}

	get(k: PluginMapKey) {
		return this.#store[this.#index(k)]?.[1];
	}

	has(k: PluginMapKey) {
		return this.#index(k) !== -1;
	}

	set(k: PluginMapKey, v: PluginExecutor) {
		if (this.has(k)) throw new DuplicatePluginError(k);
		this.#store.push([k, v]);
	}
}

export type PluginExecutor = (ctx: PluginContext) => PluginResult | Promise<PluginResult>;

export class Plugin {
	store = new PluginMap();

	new(phrase: string, executor: PluginExecutor): PluginExecutor;
	new(params: string[], phrase: string, executor: PluginExecutor): PluginExecutor;
	new(openconnect: 'open' | 'connect', phrase: string, executor: PluginExecutor): PluginExecutor;
	new(
		openconnect: 'open' | 'connect',
		params: string[],
		phrase: string,
		executor: PluginExecutor
	): PluginExecutor;
	new(
		phraseOrParamsOrOpenconnect: string | string[] | 'open' | 'connect',
		executorOrPhraseOrParams: PluginExecutor | string | string[],
		executorOrPhrase?: PluginExecutor | string,
		executor?: PluginExecutor
	): PluginExecutor {
		let openconnect: PluginMapKey['openconnect'];
		let params: undefined | string[];
		let phrase: string;

		if (
			// The 4th clause:
			typeof phraseOrParamsOrOpenconnect === 'string' &&
			(phraseOrParamsOrOpenconnect === 'open' || phraseOrParamsOrOpenconnect === 'connect') &&
			Array.isArray(executorOrPhraseOrParams) &&
			typeof executorOrPhrase === 'string' &&
			executor
		) {
			openconnect = phraseOrParamsOrOpenconnect;
			params = executorOrPhraseOrParams;
			phrase = executorOrPhrase;
		} else if (
			// The 3rd clause:
			typeof phraseOrParamsOrOpenconnect === 'string' &&
			(phraseOrParamsOrOpenconnect === 'open' || phraseOrParamsOrOpenconnect === 'connect') &&
			typeof executorOrPhraseOrParams === 'string' &&
			typeof executorOrPhrase === 'function'
		) {
			openconnect = phraseOrParamsOrOpenconnect;
			phrase = executorOrPhraseOrParams;
			executor = executorOrPhrase;
		} else if (
			// The 2nd clause:
			Array.isArray(phraseOrParamsOrOpenconnect) &&
			typeof executorOrPhraseOrParams === 'string' &&
			typeof executorOrPhrase === 'function'
		) {
			params = phraseOrParamsOrOpenconnect;
			phrase = executorOrPhraseOrParams;
			executor = executorOrPhrase;
		} else if (
			// The 1st clause:
			typeof phraseOrParamsOrOpenconnect === 'string' &&
			typeof executorOrPhraseOrParams === 'function'
		) {
			phrase = phraseOrParamsOrOpenconnect;
			executor = executorOrPhraseOrParams;
		} else {
			throw new Error('unreachable');
		}

		if (phrase.split(' ').some((x) => !x.match(/^[0-9a-z]+$/)))
			throw new Error(
				'phrase must composed of alpha-numerical values split by a single space'
			);

		const key: PluginMapKey = { phrase: phrase };
		if (openconnect) key.openconnect = openconnect;
		if (params) {
			// TODO: allow underscore only in between words
			if (params.some((x) => !x.match(/^[0-9a-z_]+$/)))
				throw new Error('params must composed of alpha-numerical and underscore values');
			const duplicates = [
				...params.reduce((acc, cur) => {
					const found = acc.get(cur);
					if (found) acc.set(cur, found + 1);
					else acc.set(cur, 1);
					return acc;
				}, new Map<string, number>()),
			].reduce((acc, cur) => {
				if (cur[1] > 1) acc.push(cur[0]);
				return acc;
			}, [] as string[]);
			if (duplicates.length)
				throw new Error(`params must not have duplicate values: ${duplicates.join(', ')}`);
			key.params = params;
		}
		this.store.set(key, executor);
		return executor;
	}
}

// Todo: Maybe we should adapt some sort of monad library.

/**
 * Result of a Plugin execution.
 */
export type PluginResult = ResultOk | ResultErr;
export type ResultOk = { ok: true; value: Jsonable };
export type ResultErr = { ok: false; error: any };

/**
 * The Plugin Context.  It has every info a Plugin needs, plus some utilities.
 */
export type PluginContext = {
	/**
	 * Gets the value of the Open or Connect part of a Statement, if available.
	 *
	 * @returns The array of values of the Open or Connect part (might be
	 * empty).
	 */
	getConnect(): string[];

	/**
	 * Basically the same as {@link getConnect}, but throws if unavailable or empty.
	 *
	 * @returns The array of values of the Open or Connect part (has at least
	 * one item).
	 *
	 * @throws {@link Error} if the part is unavailable.
	 */
	fetchConnect(): [string, ...string[]];

	/**
	 * {@inheritDoc getConnect}
	 */
	getOpen(): string[];

	/**
	 * {@inheritDoc fetchConnect}
	 */
	fetchOpen(): [string, ...string[]];

	/**
	 * Gets the value of the parameter needed by the Plugin, if available.
	 *
	 * @returns the value of the parameter, or undefined if unavailable.
	 */
	get(name: string): undefined | Jsonable;

	/**
	 * Basically the same as {@link get}, but throws if unavailable.
	 *
	 * @param name - The name of the parameter.
	 *
	 * @returns the value of the parameter.
	 *
	 * @throws {@link Error} if {@link name} is unprovided.
	 */
	fetch(name: string): Jsonable;

	/**
	 * The utility function that makes a {@link Plugin} fail.  Must be used with a
	 * `return` statement.
	 */
	fail(reason: any): PluginResult;

	/**
	 * The utility function that makes a {@link Plugin} pass/succeed.  Must be used with
	 * a `return` statement.
	 */
	pass(result: Jsonable): PluginResult;
};

/**
 * Concrete implementation of {@link PluginContext}.  Used for production.
 *
 * @remark
 * The lhs values are the parameter names passed to the {@link Plugin}.  The rhs
 * values are the identifiers provided to Zenroom.  In a statement like
 * `Given I pass object 'dataToPost' and pass proxy 'myProxy'`, the lhs values
 * would be `object` and `proxy`, and the rhs values would be `'dataToPost'` and
 * `'myProxy'`.
 */
export class PluginContextImpl implements PluginContext {
	#ast: Ast;

	constructor(ast: Ast) {
		this.#ast = ast;
	}

	/**
	 * {@inheritDoc PluginContext.pass}
	 */
	pass(result: Jsonable): PluginResult {
		return { ok: true, value: result };
	}

	/**
	 * {@inheritDoc PluginContext.fail}
	 */
	fail(reason: any): PluginResult {
		return { ok: false, error: reason };
	}

	/**
	 * {@inheritDoc PluginContext.getConnect}
	 */
	getConnect(): string[] {
		return this.#ast.connect || [];
	}

	/**
	 * {@inheritDoc PluginContext.fetchConnect}
	 */
	fetchConnect(): [string, ...string[]] {
		const val = this.getConnect();
		if (val.length === 0) throw new Error('a connect is required');
		return val as [string, ...string[]];
	}

	/**
	 * {@inheritDoc PluginContext.getOpen}
	 */
	getOpen(): string[] {
		return this.#ast.open || [];
	}

	/**
	 * {@inheritDoc PluginContext.fetchOpen}
	 */
	fetchOpen(): [string, ...string[]] {
		const val = this.getOpen();
		if (val.length === 0) throw new Error('a connect is required');
		return val as [string, ...string[]];
	}

	/**
	 * {@inheritDoc PluginContext.get}
	 */
	get(lhs: string): undefined | Jsonable {
		return this.#ast.params.get(lhs);
	}

	/**
	 * {@inheritDoc PluginContext.fetch}
	 */
	fetch(lhs: string): Jsonable {
		const val = this.get(lhs);
		if (!val) throw new Error(`the parameter isn't provided: ${lhs}`);
		return val;
	}
}

/**
 * The implementation of {@link PluginContext} that must be used only for test!
 *
 * @remarks
 * It provides shortucts to mimic a concrete implementation of
 * {@link PluginContext}.
 *
 * @internal
 */
export class PluginContextTest implements PluginContext {
	#openconnect: string[] = [];
	#params = new Map<string, Jsonable>();
	readonly phrase: string = ''; // not used but required by the interface

	constructor(openconnect: string | string[], params: Record<string, Jsonable>) {
		this.#openconnect = typeof openconnect === 'string' ? [openconnect] : openconnect;
		this.#params = new Map(Object.entries(params));
	}

	/**
	 * @constructor
	 */
	static open(open: string | string[]) {
		return new this(open, {});
	}

	/**
	 * @constructor
	 */
	static connect(connect: string | string[]) {
		return new this(connect, {});
	}

	/**
	 * @constructor
	 */
	static params(params: Record<string, Jsonable>) {
		return new this([], params);
	}

	/**
	 * {@inheritDoc PluginContext.pass}
	 */
	pass(result: Jsonable): PluginResult {
		return { ok: true, value: result };
	}

	/**
	 * {@inheritDoc PluginContext.fail}
	 */
	fail(reason: any): PluginResult {
		return { ok: false, error: reason };
	}

	/**
	 * {@inheritDoc PluginContext.getConnect}
	 */
	getConnect(): string[] {
		return this.#openconnect;
	}

	/**
	 * {@inheritDoc PluginContext.fetchConnect}
	 */
	fetchConnect(): [string, ...string[]] {
		const val = this.getConnect();
		if (val.length === 0) throw new Error('a connect is required');
		return val as [string, ...string[]];
	}

	/**
	 * {@inheritDoc PluginContext.getOpen}
	 */
	getOpen(): string[] {
		return this.getConnect();
	}

	/**
	 * {@inheritDoc PluginContext.fetchOpen}
	 */
	fetchOpen(): [string, ...string[]] {
		return this.fetchConnect();
	}

	/**
	 * {@inheritDoc PluginContext.get}
	 */
	get(name: string): undefined | Jsonable {
		return this.#params.get(name);
	}

	/**
	 * {@inheritDoc PluginContext.fetch}
	 */
	fetch(name: string): Jsonable {
		const val = this.get(name);
		if (!val) throw new Error(`the parameter isn't provided: ${name}`);
		return val;
	}
}
