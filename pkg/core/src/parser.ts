// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { closest } from 'fastest-levenshtein';
import { PluginMap, Token, type PluginMapKey } from '@slangroom/core';
import { errorColor, suggestedColor, missingColor, extraColor } from '@slangroom/shared';
// read the version from the package.json
import packageJson from '@slangroom/core/package.json' with { type: 'json' };

// TODO: remove all the repeated strings!

export const version = packageJson.version;
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
		const wantsColored = [wantFirst, ...wantRest].map((x) => suggestedColor(x)).join(' or ');
		const haveRaw = have.raw;
		return new ParseError(
			`at ${have.lineNo}:${have.start + 1}-${have.end + 1
			}\n ${errorColor(haveRaw)} may be ${wantsColored}`,
		);
	}

	/**
	 * Represents an error case where a token is missing.  If a token is found
	 * but of a wrong type, use {@link wrong}.
	 *
	 * @example
	 * What is expected can be provided with the second parameter:
	 * ```ts
	 * if (tokenDoesntExist)
	 * 	throw ParseError.missing(1, "asche")
	 * ```
	 *
	 * @example
	 * What is expected could be multiple (e.g. "foo", or "bar", or "baz") also:
	 * ```ts
	 * if (tokenDoesntExist)
	 * 	throw ParseError.missing(1, "given", "then")
	 * ```
	 *
	 * @example
	 * If the first parameter is a token found previously,
	 * it creates diagnostic messages according to that.
	 * A line number can be provided instead of a token,
	 * which means that there exist no prior token.
	 */
	static missing(prevTokenOrLineNo: Token | number, wantFirst: string, ...wantRest: string[]) {
		const wantsColored = [wantFirst, ...wantRest].map((x) => missingColor(x)).join(', ');
		if (typeof prevTokenOrLineNo == 'number') {
			const lineNo = prevTokenOrLineNo;
			return new ParseError(`at ${lineNo}\n missing one of: ${wantsColored}`);
		}
		const token = prevTokenOrLineNo;
		return new ParseError(
			`at ${token.lineNo}:${token.start + 1}-${token.end + 1
			}\n must be followed by one of: ${wantsColored}`,
		);
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
		return new ParseError(
			`at ${token.lineNo}:${token.start + 1}-${token.end + 1
			}\n extra token ${extraColor(token.raw)}`,
		);
	}

	/**
	 * @internal
	 */
	constructor(message: string) {
		super(message);
		this.name = 'ParseError @slangroom/core@' + packageJson.version;
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
	errors: {message: ParseError, lineNo: number, start?: number, end?: number}[];

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
	err: {message: ParseError, lineNo: number, start?: number, end?: number}[];

	/**
	 * The line number of the match.
	 */
	lineNo: number;

	/**
	 * Whether this line wants to output the result of its plugin to a variable
	 * in the data, later to be used in other statements, perhaps.
	 */
	into?: string;

	/**
	 * Whether this line wants to output the result of its plugin to a variable
	 * in the keys, later to be used in other statements, perhaps.
	 */
	intoSecret?: string;
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

const lemmeout = {};
const newErrFun = (m: Match, t: Token[], curErrLen?: number) => {
	return function(i: number, wantsFirst: string, ...wantsRest: string[]) {
		const have = t[i];
		if (have) m.err.push({message: ParseError.wrong(have, wantsFirst, ...wantsRest), lineNo: m.lineNo, start: have.start, end: have.end});
		else
			m.err.push(
				{message: ParseError.missing((i > 2 && t[i - 1]) || m.lineNo, wantsFirst, ...wantsRest), lineNo: m.lineNo},
			);
		if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
	}
};

const openConnectParser = (m: Match, t: Token[], i: number, newErr: Function): number => {
	const k = m.key;
	// open '' and | connect to '' and
	if (k.openconnect === 'open') {
		if (t[++i]?.name !== 'open') newErr(i, 'open');
		const ident = t[++i];
		if (ident?.isIdent) m.open = ident.raw.slice(1, -1);
		else newErr(i, '\'<identifier>\'');
		if (t[++i]?.name !== 'and') newErr(i, 'and');
	} else if (k.openconnect === 'connect') {
		if (t[++i]?.name !== 'connect') newErr(i, 'connect');
		if (t[++i]?.name !== 'to') newErr(i, 'to');
		const ident = t[++i];
		if (ident?.isIdent) m.connect = ident.raw.slice(1, -1);
		else newErr(i, '\'<identifier>\'');
		if (t[++i]?.name !== 'and') newErr(i, 'and');
	}
	return i;
}
const outputParser = (m: Match, t: Token[], i: number, newErr: Function): void => {
	const lineNo = m.lineNo;
	const ident = t[t.length - 1];
	if (!m.into && !m.intoSecret && t.length - i >= 5 && ident?.isIdent) {
		for (++i; i < t.length - 5; ++i) m.err.push({message: ParseError.extra(t[i] as Token), lineNo, start: (t[i] as Token).start, end: (t[i] as Token).end});
		if (t.length - i == 4) {
			if (t[t.length - 4]?.name !== 'and') newErr(t.length - 4, 'and');
			if (t[t.length - 3]?.name !== 'output') newErr(t.length - 3, 'output');
			if (t[t.length - 2]?.name !== 'into') newErr(t.length - 2, 'into');
			if (
				t[t.length - 4]?.name === 'and' &&
				t[t.length - 3]?.name === 'output' &&
				t[t.length - 2]?.name === 'into'
			)
				m.into = ident.raw.slice(1, -1);
		} else {
			if (
				t[t.length - 4]?.name === 'and' &&
				t[t.length - 3]?.name === 'output' &&
				t[t.length - 2]?.name === 'into'
			) {
				m.err.push({message: ParseError.extra(t[t.length-5] as Token), lineNo, start: (t[t.length-5] as Token).start, end: (t[t.length-5] as Token).end});
			} else {
				if (t[t.length - 5]?.name !== 'and') newErr(t.length - 5, 'and');
				if (t[t.length - 4]?.name !== 'output') newErr(t.length - 4, 'output');
				if (t[t.length - 3]?.name !== 'secret') newErr(t.length - 3, 'secret');
				if (t[t.length - 2]?.name !== 'into') newErr(t.length - 2, 'into');
				if (
					t[t.length - 5]?.name === 'and' &&
					t[t.length - 4]?.name === 'output' &&
					t[t.length - 3]?.name === 'secret' &&
					t[t.length - 2]?.name === 'into'
				)
					m.intoSecret = ident.raw.slice(1, -1);
			}
		}
	} else {
		for (++i; i < t.length; ++i) m.err.push({message: ParseError.extra(t[i] as Token), lineNo, start: (t[i] as Token).start, end: (t[i] as Token).end});
	}
}

const givenThenParser = (m: Match, t: Token[], curErrLen?: number): boolean => {
	const newErr = newErrFun(m, t, curErrLen);
	const k = m.key;
	let i = 0;
	// I
	if (t[i+1]?.raw == 'I') {
		++i;
	} else {
		// understand if I is missing or written wrong
		if (
			t[i+1]?.name == 'connect'
			|| t[i+1]?.name == 'open'
			|| t[i+1]?.name == 'send'
			|| t[i+1]?.name == k.phrase.split(' ')[0]
		) {
			m.err.push(
				{message: ParseError.missing(t[i]!, 'I'), lineNo: m.lineNo},
			);
		} else {
			++i;
			newErr(i, 'I');
		}
	}

	// open '' and | connect to '' and
	i = openConnectParser(m, t, i, newErr);
	// Send $buzzword 'ident' And
	// TODO: allow spaces in between params
	const params = new Set(k.params);
	k.params?.forEach(() => {
		if (t[++i]?.name !== 'send') newErr(i, 'send');
		const tokName = t[++i];
		if (tokName && params.has(tokName.name)) {
			params.delete(tokName.name);
		} else {
			const [first, ...rest] = [...params.values()] as [string, ...string[]];
			newErr(i, first, ...rest);
		}

		const ident = t[++i];
		if (ident?.isIdent) {
			if (tokName) m.bindings.set(tokName.name, ident.raw.slice(1, -1));
		} else {
			newErr(i, '\'<identifier>\'');
		}
		if (t[++i]?.name !== 'and') newErr(i, 'and');
	});
	// $buzzwords
	k.phrase.split(' ').forEach((name) => t[++i]?.name !== name && newErr(i, name));
	// Output Into 'ident' || Output Secret Into 'ident'
	outputParser(m, t, i, newErr);

	if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
	return (curErrLen !== undefined && m.err.length < curErrLen);
}

const prepareComputeParser = (m: Match, t: Token[], curErrLen?: number): boolean => {
	const newErr = newErrFun(m, t, curErrLen);
	const k = m.key;
	let i = 0;
	// 'ident'|secret 'ident'|undefined
	const secondToken = t[i+1];
	if(secondToken?.isIdent) {
		++i;
		m.into = secondToken.raw.slice(1, -1);
		if(t[++i]?.name !== ':') newErr(i, ':');
	} else if (secondToken?.name === 'secret') {
		++i;
		const thirdToken = t[++i];
		if (thirdToken?.isIdent) {
			m.intoSecret = thirdToken.raw.slice(1, -1);
		} else {
			newErr(i, '\'<identifier>\'');
		}
		if(t[++i]?.name !== ':') newErr(i, ':')
	}
	// open '' and | connect to '' and
	i = openConnectParser(m, t, i, newErr);
	// $buzzwords
	k.phrase.split(' ').forEach((name) => t[++i]?.name !== name && newErr(i, name));
	// With $buzzword 'ident', | Where $buzzword is 'ident',
	// TODO: allow spaces in between params
	const params = new Set(k.params);
	if (k.params) {
		const whereWith = t[++i]?.name;
		if (whereWith !== 'where' && whereWith !== 'with')
			newErr(i, 'with', 'where')
		k.params.forEach((_, index) => {
			const tokName = t[++i];
			if (tokName && params.has(tokName.name)) {
				params.delete(tokName.name);
			} else {
				const [first, ...rest] = [...params.values()] as [string, ...string[]];
				newErr(i, first, ...rest);
			}
			if (whereWith == 'where' && t[++i]?.name !== 'is') {
				newErr(i, 'is');
			}
			const ident = t[++i];
			if (ident?.isIdent) {
				if (tokName) m.bindings.set(tokName.name, ident.raw.slice(1, -1));
			} else {
				newErr(i, '\'<identifier>\'');
			}
			if (index+1 !== k.params?.length && t[++i]?.name !== ',') newErr(i, ',')
		})
	}
	// Output Into 'ident' || Output Secret Into 'ident'
	outputParser(m, t, i, newErr);

	if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
	return (curErrLen !== undefined && m.err.length < curErrLen);
}

/**
 * Parses the given tokens of a lexed line and plugins, and generates a CST with possible
 * matches of those plugins.
 */
export const parse = (p: PluginMap, t: Token[], lineNo: number): Cst => {
	const cst: Cst = {
		matches: [],
		errors: [],
	};
	let isGivenThen: boolean = false;
	let isPrepareCompute: boolean = false;
	let openConnect: 'open' | 'connect' | undefined;
	if (t[0]) {
		let name = t[0].name;
		if(name == 'given' || name == 'then') {
			isGivenThen = true;
			cst.givenThen = name;
			if (t[2]?.raw == 'open') openConnect = 'open';
			else if (t[2]?.raw == 'connect') openConnect = 'connect';
		} else {
			if (name.endsWith(':')) name = name.slice(0, -1)
			if (name == 'prepare' || name == 'before' || name == 'compute' || name == 'after') {
				isPrepareCompute = true;
				cst.givenThen = name == 'prepare' || name == 'before' ? 'given' : 'then';
				// Prepare: connect/open
				// Prepare 'ident' : connect/open
				// Prepare secret 'ident': connect/open
				if (
					t[1]?.raw == 'connect'
					|| t[3]?.raw == 'connect'
					|| t[4]?.raw == 'connect'
				) {
					openConnect = 'connect';
				} else if (
					t[1]?.raw == 'open'
					|| t[3]?.raw == 'open'
					|| t[4]?.raw == 'open'
				) {
					openConnect = 'open';
				}
			} else {
				const cl = closest(name, ['given', 'then', 'prepare', 'before', 'compute', 'after'])
				if (cl === 'given' || cl === 'then') {
					isGivenThen = true;
					cst.errors.push({ message: ParseError.wrong(t[0], 'given', 'then'), lineNo, start: t[0].start, end: t[0].end });
				} else {
					isPrepareCompute = true;
					cst.errors.push({ message: ParseError.wrong(t[0], 'prepare', 'before', 'compute', 'after'), lineNo, start: t[0].start, end: t[0].end });
				}
			}
		}
	} else {
		cst.errors.push({ message: ParseError.missing(lineNo, 'Given I', 'Then I', 'Prepare', '...'), lineNo});
		return cst;
	}

	p.forEach(([k]) => {
		// check open and connect statement only against the correct statements
		if(openConnect && (openConnect !== k.openconnect)) return;

		// given/then parsing
		if (isGivenThen) {
			try {
				const m: Match = { key: k, bindings: new Map(), err: [], lineNo: lineNo };
				if (givenThenParser(m, t, cst.matches[0]?.err.length)) cst.matches.length = 0;
				cst.matches.push(m);
			} catch(e) {
				if (e !== lemmeout) throw(e)
			}
		}

		// prepare/compute parsing
		if (isPrepareCompute) {
			try {
				const mm: Match = { key: k, bindings: new Map(), err: [], lineNo: lineNo };
				if (prepareComputeParser(mm, t, cst.matches[0]?.err.length)) cst.matches.length = 0;
				cst.matches.push(mm);
			} catch(e) {
				if (e !== lemmeout) throw(e)
			}
		}
	});
	return cst;
};
