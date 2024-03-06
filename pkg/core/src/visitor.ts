import type { Cst, Match, PluginMapKey } from '@slangroom/core';
import type { Jsonable, ZenParams } from '@slangroom/shared';

/**
 * The AST (Abstract Syntax Tree) representation of a custom statement,
 * associated with its plugin definition.
 *
 * @remarks
 * This is basically what allows us to feed all required parameters to a plugin
 * definition and store the result to some variable, if wanted.
 */
export type Ast = {
	/**
	 * The plugin definition associated with this certain AST.
	 */
	key: PluginMapKey;

	/**
	 * A set of values associated with the parameters.
	 *
	 * @example
	 * Given a statement like this:
	 * ```
	 * Given I send foo 'bar' and send baz 'quz' ...
	 * ```
	 *
	 * and a parameters provided like this:
	 * ```json
	 * {
	 * 	"bar": {
	 * 		"i love": "Asche",
	 * 		"array example": ["domates", "biber", "patlican"]
	 * 	},
	 * 	"quz": "simple string"
	 * }
	 * ```
	 *
	 * this would be populated as following:
	 * ```ts
	 * new Map([
	 * 	["foo", {
	 * 		"i love": "Asche",
	 * 		"array example": ["domates", "biber", "patlican"]
	 * 	}],
	 * 	["baz", "simple string"]
	 * ]);
	 * ```
	 */
	params: Map<string, Jsonable>;

	/**
	 * The name of the variable (if any) to output the result of this plugin.
	 *
	 * @example
	 * Given a statement like this:
	 * ```
	 * Given I send http request and output into 'result'
	 * ```
	 *
	 * this would be `result`.
	 */
	into?: string;
} & (
	| {
			/**
			 * The value of the variable used in Open, must be a string or a
			 * list of string, former of which is converted to an array for
			 * convenience.
			 */
			open?: [string, ...string[]];
			connect?: never;
	  }
	| {
			open?: never;
			/**
			 * The value of the variable used in Connect, must be a string or a
			 * list of string, former of which is converted to an array for
			 * convenience.
			 */
			connect?: [string, ...string[]];
	  }
);

/**
 * Visits the given CST with parameters and generates the AST for it.
 *
 * @param cst The Concrete Syntax Tree.
 * @param params The Zenroom parameters.
 *
 * @returns The generated AST.
 *
 * @throws {@link Error}
 * If the given {@link cst} contains any general errors.
 *
 * @throws {@link Error}
 * If the given {@link cst} doesn't have exactly one match.
 *
 * @throws {@link Error}
 * If the given {@link cst}'s match contains any errors.
 */
export const visit = (cst: Cst, params: ZenParams): Ast => {
	if (cst.errors.length) throw new Error('cst must not have any general errors');
	if (cst.matches.length !== 1) throw new Error('cst must have only one match');
	const m = cst.matches[0] as Match;
	if (m.err.length) throw new Error("cst's match must not have any errors");

	const ast: Ast = {
		key: m.key,
		params: new Map(),
	};

	if (m.into) ast.into = m.into;
	if (m.open) ast.open = fetchOpenconnect(params, m.open);
	if (m.connect) ast.connect = fetchOpenconnect(params, m.connect);

	m.bindings?.forEach((ident, name) => {
		const val = fetchDatakeys(params, ident);
		ast.params.set(name, val);
	});

	return ast;
};

/**
 * Gets the value of {@link rhs} from the `data` or `keys` part of Zenroom
 * parameters.
 *
 * @remarks
 * The {@link rhs} name is used in a sense that rhs is `'bar'` while the lhs
 * is `foo`.
 * ```
 * Given I send foo 'bar' and ...
 * ```
 *
 * @param params The Zenroom parameters.
 * @param rsh The right hand side value, the identifier used as a key.
 */
const getDatakeys = (params: ZenParams, rhs: string): undefined | Jsonable =>
	params.data[rhs] ? params.data[rhs] : params.keys[rhs];

/**
 * Same as {@link getDatakeys}, but throws error if {@link rhs} doesn't exist.
 *
 * @throws {@link Error}
 * If {@link rhs} doesn't exist.
 */
const fetchDatakeys = (params: ZenParams, rhs: string): Jsonable => {
	const val = getDatakeys(params, rhs);
	if (val === undefined) throw new Error(`Can't find ${rhs} in DATA or KEYS`);
	return val;
};

/**
 * Basically, a wrapper around {@link getDatakeys} that ensures the type of the
 * returned value.
 */
const getOpenconnect = (params: ZenParams, rhs: string): string[] => {
	const val = getDatakeys(params, rhs);
	if (typeof val === 'string') return [val];
	if (Array.isArray(val)) {
		if (val.every((x) => typeof x === 'string')) return val as string[];
		else throw new Error(`the array referenced by ${rhs} must solely composed of strings`);
	}
	return [];
};

/**
 * Same as {@link getOpenconnect}, but throws an error if {@link rhs} doesn't exist.
 *
 * @throws {@link Error}
 * If {@link rhs} doesn't exist.
 */
const fetchOpenconnect = (params: ZenParams, rhs: string): [string, ...string[]] => {
	const val = getOpenconnect(params, rhs);
	if (val.length === 0) throw new Error(`${rhs} must contain a value`);
	return val as [string, ...string[]];
};
