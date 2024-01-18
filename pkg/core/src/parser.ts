import { PluginMap, Token, type PluginMapKey } from '@slangroom/core';

/**
 * Represents an error encountered during the parsing phrase.
 *
 * @remarks
 * The class must not be used directly with `new`.  Instead, the static
 * constructor methods must be used.
 *
 * In case of:
 * - a wrong type of token is found, use {@link wrong};
 * - a token is not provided, missing, use {@link missing};
 * - an extra token is found, use {@link extra}:
 */
export class ParseError extends Error {
	/**
	 * Represents an error case where a wrong type of one or multiple tokens are
	 * found.  If a token is not found, use {@link missing}.
	 *
	 * @example
	 * An alternative can be provided with the second parameter:
	 * ```ts
	 * if (token.name !== "asche")
	 * 	throw ParseError.wrong(token, "asche")
	 * ```
	 *
	 * @example
	 * Multiple alternatives (e.g. "foo", or "bar", or "baz") can be provided also:
	 * ```ts
	 * if (token.name !== "given" || token.name !== "then")
	 * 	throw ParseError.wrong(token, "given", "then")
	 * ```
	 */
	static wrong(have: Token, wantFirst: string, ...wantRest: string[]) {
		const wants = [wantFirst, ...wantRest];
		return new ParseError(
			`"${have.raw}" between (${have.start}, ${have.end}) must be one of: ${wants.join(
				', ',
			)}`,
		);
	}

	/**
	 * Represents an error case where a token is missing.  If a token is found
	 * but of a wrong type, use {@link wrong}.
	 *
	 * @example
	 * What is expected can be provided with the first parameter:
	 * ```ts
	 * if (tokenDoesntExist)
	 * 	throw ParseError.missing("asche")
	 * ```
	 *
	 * @example
	 * What is expected could be multiple (e.g. "foo", or "bar", or "baz") also:
	 * ```ts
	 * if (tokenDoesntExist)
	 * 	throw ParseError.missing("given", "then")
	 * ```
	 */
	static missing(wantFirst: string, ...wantRest: string[]) {
		const wants = [wantFirst, ...wantRest];
		return new ParseError(`missing token(s): ${wants.join(', ')}`);
	}

	/**
	 * Represents an error case where an unexpected extra token is found.
	 *
	 * @example
	 * ```ts
	 * if (token)
	 *	throw ParseError.extra(token)
	 * ```
	 */
	static extra(token: Token) {
		return new ParseError(`extra token (${token.start}, ${token.end}): ${token.raw}`);
	}

	/**
	 * @internal
	 */
	constructor(message: string) {
		super(message);
		this.name = 'ParseError';
	}
}

/**
 * The CST (Concrete Syntax Tree) of a parsed line with error information.
 */
export type Cst = {
	/**
	 * Whether the line starts with "Given" or "Then" tokens, or none.
	 */
	givenThen?: 'given' | 'then';

	/**
	 * Any errors not involving the match of a plugin is found during parsing.
	 * Errors such as "Given is not found" or "I needs to be capitalized" would
	 * fit in this category.
	 */
	errors: ParseError[];

	/**
	 * List of possible matches of plugins with their possible errors for ranking and
	 * reporting.
	 */
	matches: Match[];
};

/**
 * A possible match of a plugin using its {@link PluginMapKey}.
 */
export type Match = {
	/**
	 * List of bindings of the plugin, pairs of parameters of the plugin and
	 * their corresponding values, which are JSON keys that point to the actual
	 * values.
	 *
	 * @example
	 * `Given I send foo 'bar' and send baz 'quz' ...` would result in a map of
	 * bindings like this:
	 *
	 * ```
	 * {
	 * 	"foo": "bar",
	 * 	"baz": "quz",
	 * }
	 *
	 * Here, `foo` and `baz` are parameters of a plugin, and `bar` and `quz` are
	 * keys to the actual values (found in `data` or `keys` section of Zenroom).
	 * ```
	 */
	bindings: Map<string, string>;

	/**
	 * The key of the match, a {@link PluginMapKey}.  This is what allows us to
	 * know that a match belongs to a certain plugin.
	 */
	key: PluginMapKey;

	/**
	 * List of possible parsing errors specific to the plugin.  Currently, this
	 * is what allows us to rank the list of possible matches.
	 */
	err: ParseError[];

	/**
	 * Whether this line wants to output the result of its plugin to a variable,
	 * later to be used in other statements, perhaps.
	 */
	into?: string;
} & (
		| {
			/**
			 * Whether this line uses Open or Connect.  Having neither is an
			 * error that would show up in {@link err}.
			 */
			open?: string;

			/**
			 * Whether this line uses Open or Connect.  Having neither is an
			 * error that would show up in {@link err}.
			 */
			connect?: never;
		}
		| {
			/**
			 * Whether this line uses Open or Connect.  Having neither is an
			 * error that would show up in {@link err}.
			 */
			open?: never;

			/**
			 * Whether this line uses Open or Connect.  Having neither is an
			 * error that would show up in {@link err}.
			 */
			connect?: string;
		}
	);

/**
 * Parses the given tokens of a lexed line and plugins, and generates a CST with possible
 * matches of those plugins.
 */
export const parse = (p: PluginMap, t: Token[]): Cst => {
	const cst: Cst = {
		matches: [],
		errors: [],
	};
	let givenThen: 'given' | 'then' | undefined;

	// Given or Then
	if (t[0]?.name === 'given') givenThen = 'given';
	else if (t[0]?.name === 'then') givenThen = 'then';
	else if (t[0]) cst.errors.push(ParseError.wrong(t[0], 'given', 'then'));
	else cst.errors.push(ParseError.missing('given', 'then'));

	// TODO: should we allow "that" here ("Given that I")

	// I
	if (t[1]) {
		if (t[1]?.raw !== 'I') cst.errors.push(ParseError.wrong(t[1], 'I'));
	} else {
		cst.errors.push(ParseError.missing('I'));
	}
	p.forEach(([k]) => {
		let i = 1;
		const m: Match = { key: k, bindings: new Map(), err: [] };
		const curErrLen = cst.matches[0]?.err.length;
		const lemmeout = {};
		const newErr = (have: undefined | Token, wantsFirst: string, ...wantsRest: string[]) => {
			if (have) m.err.push(ParseError.wrong(have, wantsFirst, ...wantsRest));
			else m.err.push(ParseError.missing(wantsFirst, ...wantsRest));
			if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
		};
		try {
			// Open 'ident' and|Connect to 'ident' and
			if (k.openconnect === 'open') {
				if (t[++i]?.name !== 'open') newErr(t[i], 'open');
				const ident = t[++i];
				if (ident?.isIdent) m.open = ident.raw.slice(1, -1);
				else newErr(ident, '<identifier>');
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			} else if (k.openconnect === 'connect') {
				if (t[++i]?.name !== 'connect') newErr(t[i], 'connect');
				if (t[++i]?.name !== 'to') newErr(t[i], 'connect');
				const ident = t[++i];
				if (ident?.isIdent) m.connect = ident.raw.slice(1, -1);
				else newErr(ident, '<identifier>');
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			}

			// Send $buzzword 'ident' And
			// TODO: allow spaces in between params
			const params = new Set(k.params);
			k.params?.forEach(() => {
				if (t[++i]?.name !== 'send') newErr(t[i], 'send');

				const tokName = t[++i];
				if (tokName && params.has(tokName.name)) {
					params.delete(tokName.name);
				} else {
					const [first, ...rest] = [...params.values()] as [string, ...string[]];
					newErr(t[i], first, ...rest);
				}

				const ident = t[++i];
				if (ident?.isIdent) {
					if (tokName) m.bindings.set(tokName.name, ident.raw.slice(1, -1));
				} else {
					newErr(ident, '<identifier>');
				}
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			});

			// $buzzwords
			k.phrase.split(' ').forEach((name) => t[++i]?.name !== name && newErr(t[i], name));

			// Save Output Into 'ident'
			const ident = t[t.length - 1];
			if (t.length - i >= 5 && ident?.isIdent) {
				for (++i; i < t.length - 4; ++i) m.err.push(ParseError.extra(t[i] as Token));
				if (t[t.length - 4]?.name !== 'and') newErr(t[t.length - 4], 'and');
				if (t[t.length - 3]?.name !== 'output') newErr(t[t.length - 3], 'output');
				if (t[t.length - 2]?.name !== 'into') newErr(t[t.length - 2], 'into');
				if (
					t[t.length - 4]?.name === 'and' &&
					t[t.length - 3]?.name === 'output' &&
					t[t.length - 2]?.name === 'into'
				)
					m.into = ident.raw.slice(1, -1);
			} else {
				for (++i; i < t.length; ++i) m.err.push(ParseError.extra(t[i] as Token));
			}

			if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
			if (curErrLen !== undefined && m.err.length < curErrLen) cst.matches.length = 0;
			cst.matches.push(m);
		} catch (e) {
			if (e !== lemmeout) throw e;
		}
	});

	if (givenThen) cst.givenThen = givenThen;
	return cst;
};
