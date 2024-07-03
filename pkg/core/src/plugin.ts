// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Jsonable } from '@slangroom/shared';
import type { Ast } from '@slangroom/core';

/**
 * The representation of a plugin definition.  It is also used as a key in
 * {@link PluginMap}.
 */
export type PluginMapKey = {
	/**
	 * The phrase of the plugin.
	 *
	 * @example
	 * The `love asche` of the supposed plugin definition
	 * ```
	 * Given I send howmuch 'quantity' and love asche.
	 * ```
	 * is the phrase part.
	 *
	 * It must only be composed of alpha-numerical values with underscores or
	 * dashes in between them (let's call them "words" here), and those "words"
	 * must be split by whitespace (ensured by the plugin definition as just a
	 * single blank space).
	 */
	phrase: string;

	/**
	 * An unordered list of parameters of a plugin.
	 *
	 * @example
	 * The `object` and `header` of the supposed plugin definition
	 * ```
	 * Given I connect to 'url' and send object 'obj' and send headers 'hdr' and do http post request
	 * ```
	 * are the example of parameters of that definition.  A plugin might not
	 * have any parameters.
	 */
	params?: string[];

	/**
	 * Whether a plugin definition uses Open or Connect, or not.
	 *
	 * @example
	 * The `connect to 'url'` of the plugin definiton
	 * ```
	 * Given I connect to 'url' and send http get request
	 * ```
	 * is the Connect.
	 *
	 * @example
	 * The `open 'url'` of the plugin definiton
	 * ```
	 * Given I open 'path' and read from file
	 * ```
	 * is the Open.
	 */
	openconnect?: 'open' | 'connect';
};

/**
 * An error indicating that in a {@link PluginMap}, there exist more than a
 * single unique {@link PluginMapKey}.
 */
export class DuplicatePluginError extends Error {
	constructor({ openconnect, params, phrase }: PluginMapKey) {
		super(
			`duplicated plugin with key: openconnect=${openconnect ?? ''} params=${[
				...(params ?? []),
			].join(', ')} phrase="${phrase}"`,
		);
		this.name = 'DubplicatePluginError';
	}
}

/**
 * A custom map implementation that uses {@link PluginMapKey} for the key parts,
 * and {@link PluginExecutor} for the value parts.
 *
 * @remarks
 * The reason we needed a custom implementation of a map is because of the fact
 * that that {@link Map} class in JS uses the reference values of objects to
 * check for uniqueness, not the fields and values of those fields in an object,
 * which is a sensible default in a JS sensible manner, but doesn't work for us...
 */
export class PluginMap {
	/**
	 * The datastore backing our implementation of a map.
	 *
	 * We use an array for the implementation, and each method mutating this
	 * array ensures that only a single unique value of {@link PluginMapKey}
	 * exists in the entire array.
	 */
	#store: [PluginMapKey, PluginExecutor][] = [];

	/**
	 * Finds the index of the value inside the {@link #store}, where
	 * {@link their} key matches with our's.
	 *
	 * @param their Their {@link PluginMapKey} to match against ours.
	 * @returns the index of the match if found, or `-1` otherwise.
	 */
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

	/**
	 * Loops over each value of the map, with a callback function taking a
	 * single argument of an array of pairs of {@link PluginMapKey} and
	 * {@link PluginExecutor}, respectively.
	 *
	 * @privateRemarks
	 * I don't know why I can't just use `forEach = this.#store.forEach`, but it
	 * just doesn't work.  So I have to define it this way, which provides a
	 * limited set of what's possible with {@link #store.forEach}.
	 */
	forEach(cb: (value: [PluginMapKey, PluginExecutor]) => void) {
		this.#store.forEach(cb);
	}

	/**
	 * If exists, looks up the {@link PluginExecutor} referenced by {@link k}.
	 *
	 * @param k The key to look up with.
	 *
	 * @returns the {@link PluginExecutor} if exists.
	 */
	get(k: PluginMapKey) {
		return this.#store[this.#index(k)]?.[1];
	}

	/**
	 * Checks whether the given key {@link k} exists in the map.
	 *
	 * @param k The key to look up with.
	 *
	 * @returns Whether the key exists or not.
	 */
	has(k: PluginMapKey) {
		return this.#index(k) !== -1;
	}

	/**
	 * Sets the value {@link v} using the key {@link v}.
	 *
	 * @param k The key to point to the value {@link v}.
	 * @param v The value to be pointed to by the key {@link k}.
	 *
	 * @throws {@link DuplicatePluginError}
	 * If the key {@link k} already exists in the map.
	 */
	set(k: PluginMapKey, v: PluginExecutor) {
		if (this.has(k)) throw new DuplicatePluginError(k);
		this.#store.push([k, v]);
	}
}

/**
 * A callback function taking a single argument, which is called the "context",
 * that is used to decide what to do with the plugin (access parameters, make
 * the execution pass or fail, etc.).
 *
 * @example
 * ```ts
 * const lowercasify = (ctx) => {
 * 	const foo = ctx.fetch("foo");
 * 	if (typeof foo !== "string")
 * 		return ctx.fail("foo must be string");
 * 	return ctx.pass(foo.toLowerCase());
 * };
 * ```
 */
export type PluginExecutor = (ctx: PluginContext) => PluginResult | Promise<PluginResult>;

/**
 * Collects each custom implementation of a statement under a single unit, which
 * is called a "plugin".
 *
 * @remarks
 * A plugin can contain one or many implementations of custom statements, which
 * are unique in the same definition of the plugin.
 */
export class Plugin {
	/**
	 * The list of plugin definitions belonging to this plugin.
	 */
	readonly store = new PluginMap();

	/**
	 * Defines a new plugin that has only a phrase.
	 *
	 * @param phrase The phrase of the definition.
	 * @param executor The callback function to be ran when the plugin
	 * definition matches with a given line.
	 *
	 * @throws {@link Error}
	 * If {@link phrase} is ill-formed.
	 *
	 * @throws {@link DuplicatePluginError}
	 * If the definition is duplicated.
	 */
	new(phrase: string, executor: PluginExecutor): PluginExecutor;

	/**
	 * Defines a new plugin that has a list of parameters along with a phrase.
	 *
	 * @param params The list of parameters to be needed by this plugin.
	 * @param phrase The phrase of the definition.
	 * @param executor The callback function to be ran when the plugin
	 * definition matches with a given line.
	 *
	 * @throws {@link Error}
	 * If any value of {@link params} is ill-formed.
	 *
	 * @throws {@link Error}
	 * If {@link params} has duplicated entries.
	 *
	 * @throws {@link Error}
	 * If {@link phrase} is ill-formed.
	 *
	 * @throws {@link DuplicatePluginError}
	 * If the definition is duplicated.
	 */
	new(params: string[], phrase: string, executor: PluginExecutor): PluginExecutor;

	/**
	 * Defines a new plugin that has an open or connect along with a phrase.
	 *
	 * @param openconnect Whether this definition uses open or connect.
	 * @param phrase The phrase of the definition.
	 * @param executor The callback function to be ran when the plugin
	 * definition matches with a given line.
	 *
	 * @throws {@link Error}
	 * If {@link phrase} is ill-formed.
	 *
	 * @throws {@link DuplicatePluginError}
	 * If the definition is duplicated.
	 */
	new(openconnect: 'open' | 'connect', phrase: string, executor: PluginExecutor): PluginExecutor;

	/**
	 * Defines a new plugin that has an open or connect along with a list of
	 * params and a phrase.
	 *
	 * @param openconnect Whether this definition uses open or connect.
	 * @param params The list of parameters to be needed by this plugin.
	 * @param phrase The phrase of the definition.
	 * @param executor The callback function to be ran when the plugin
	 * definition matches with a given line.
	 *
	 * @throws {@link Error}
	 * If any value of {@link params} is ill-formed.
	 *
	 * @throws {@link Error}
	 * If {@link params} has duplicated entries.
	 *
	 * @throws {@link Error}
	 * If {@link phrase} is ill-formed.
	 *
	 * @throws {@link DuplicatePluginError}
	 * If the definition is duplicated.
	 */
	new(
		openconnect: 'open' | 'connect',
		params: string[],
		phrase: string,
		executor: PluginExecutor,
	): PluginExecutor;

	/**
	 * The concerete implementation of the many overridden {@link new} methods.
	 * See them for their documentation.
	 */
	new(
		phraseOrParamsOrOpenconnect: string | string[] | 'open' | 'connect',
		executorOrPhraseOrParams: PluginExecutor | string | string[],
		executorOrPhrase?: PluginExecutor | string,
		executor?: PluginExecutor,
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
		} /* c8 ignore next 4 */ else {
			// This should be unreachable.
			throw new Error('unreachable');
		}

		if (phrase.split(' ').some((x) => !isSane(x)))
			throw new Error(
				'phrase must be composed of alpha-numerical, underscore, and dash values split by a single space',
			);

		const key: PluginMapKey = { phrase: phrase };
		if (openconnect) key.openconnect = openconnect;
		if (params) {
			// TODO: allow spaces in params
			const found = params.find((x) => !isSane(x));
			if (found !== undefined)
				throw new Error(
					`the following parameter must be composed of alpha-numerical values, optionally split by dashes or underscores: ${found}`,
				);

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

/**
 * @internal
 * Check the sanity of a Phrase or Param for the following:
 *
 * 1. Must start with a letter.
 * 2. Dashes and underscores are allowed only inbetween words once.
 * 3. Must be composed solely of letter, digits, dashes, and underscores.
 *
 * @param str The input to be checked for sanity.
 * @returns whether it is sane or not.
 */
export const isSane = (str: string) => /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/.test(str);

// Todo: Maybe we should adapt some sort of monad library.

/**
 * Result of a plugin execution.
 */
export type PluginResult = ResultOk | ResultErr;

/**
 * Result of a plugin execution, indicating success.
 */
export type ResultOk = { ok: true; value: Jsonable };

/**
 * Result of a plugin execution, indicating failure.
 */
export type ResultErr = { ok: false; error: any };

/**
 * The Plugin Context.  It has every info a plugin needs, plus some utilities.
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
		if (val.length === 0) throw new Error('a open is required');
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
		const val = this.getOpen();
		if (val.length === 0) throw new Error('a open is required');
		return val as [string, ...string[]];
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
