import type { Jsonable, ZenParams } from '@slangroom/shared';
import { Parser, type Statement } from '@slangroom/core';

/**
 * A Plugin definition.
 */
export type Plugin = {
	parser: (this: Parser) => void;
	executor: PluginExecutor;
};

/**
 * @example
 * ```ts
 * const myPlugin = async (ctx: PluginContext) => Promise<PluginResult> {
 *	if (ctx.phrase !== "doesn't match with my definition")
 *		return ctx.fail("syntax error");
 *
 *	const filePath = ctx.fetch("path");
 *	if (typeof filePath !== "string")
 *		return ctx.fail("file must be string")$
 *
 *	const [err, result] = writeFile(filePath, "hello, world!");
 *	if (err)
 *		return ctx.fail(err);
 *
 *	return ctx.pass(result);
 * }
 * ```
 */
export type PluginExecutor = (ctx: PluginContext) => PluginResult | Promise<PluginResult>;

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
	 * The Phrase part of a Statement.
	 */
	phrase: string;

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
	/**
	 * {@inheritDoc PluginContext.phrase}
	 */
	readonly phrase: string;

	/**
	 * The name of the identifier used to reference the Open or Connect
	 * parameters (via {@link #zparams}).  It is an rhs value.
	 */
	#openconnect: string | undefined = undefined;

	/**
	 * A map between parameters that should be provided to a statetment and
	 * identifiers.
	 *
	 * @remarks
	 * Such as `address => 'myAddress'` and `proxy => 'foobar'`.  The ones on
	 * the lhs are what the statement needs, and the ones on the rhs are the
	 * identifiers provided to the contract (via [[#data]] or [[#keys]]).
	 */
	#bindings = new Map<string, string>();

	/**
	 * The ZenParams.
	 */
	#zparams: ZenParams = { data: {}, keys: {} };

	constructor(stmt: Statement, zparams: ZenParams) {
		this.phrase = stmt.phrase;
		this.#openconnect = stmt.openconnect;
		this.#bindings = stmt.bindings;
		this.#zparams = zparams;
	}

	/**
	 * Gets the value referenced by {@link name} from {@link #zparams}.
	 */
	#getDataKeys(rhs: string): undefined | Jsonable {
		return this.#zparams.data[rhs] ? this.#zparams.data[rhs] : this.#zparams.keys[rhs];
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
		if (!this.#openconnect) return [];
		const val = this.#getDataKeys(this.#openconnect);
		if (typeof val === 'string') return [val];
		if (Array.isArray(val)) {
			if (val.every((x) => typeof x === 'string')) return val as string[];
			else
				throw new Error(
					`the array referenced by ${this.#openconnect} must solely composed of strings`,
				);
		}
		return [];
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
	get(lhs: string): undefined | Jsonable {
		const rhs = this.#bindings.get(lhs);
		if (!rhs) return undefined;
		return this.#getDataKeys(rhs);
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
