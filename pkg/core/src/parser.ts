// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { closest } from 'fastest-levenshtein';
import { PluginMap, Token, type PluginMapKey } from '@slangroom/core';
import { errorColor, suggestedColor, missingColor, extraColor } from '@slangroom/shared';
// read the version from the package.json
import packageJson from '@slangroom/core/package.json' with { type: 'json' };

enum TokenType {
	AFTER = 'after',
	AND = 'and',
	BEFORE = 'before',
	COLON = ':',
	COMMA = ',',
	COMPUTE = 'compute',
	CONNECT = 'connect',
	GIVEN = 'given',
	I = 'I',
	IDENTIFIER = '\'<identifier>\'',
	INTO = 'into',
	IS = 'is',
	OPEN = 'open',
	OUTPUT = 'output',
	PREPARE = 'prepare',
	SECRET = 'secret',
	SEND = 'send',
	THEN = 'then',
	TO = 'to',
	WHERE = 'where',
	WITH = 'with',
  };

enum IdentType {
	BINDINGS = 'bindings',
	OPEN = 'open',
	CONNECT = 'connect',
	INTO = 'into',
	INTOSECRET = 'intoSecret',
}

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

class ErrorHandler {
	constructor(private m: Match, private t: Token[], private curErrLen?: number) {}

	report(i: number, expected: string, ...alternates: string[]) {
		const have = this.t[i];
		if (have) {
			this.m.err.push({
				message: ParseError.wrong(have, expected, ...alternates),
				lineNo: this.m.lineNo,
				start: have.start,
				end: have.end
			});
		} else {
			this.m.err.push({
				message: ParseError.missing((i > 2 && this.t[i - 1]) || this.m.lineNo, expected, ...alternates),
				lineNo: this.m.lineNo
			});
		}

		if (this.curErrLen !== undefined && this.m.err.length > this.curErrLen) throw lemmeout;
	}

	expect(i: number, expected: string, ...alternates: string[]) {
		if (this.t[i]?.name !== expected) {
			this.report(i, expected, ...alternates);
			return false;
		}
		return true;
	}

	isIdent(i: number, dest: string, tokName?: Token) {
		if (!this.t[i]?.isIdent) {
			this.report(i, TokenType.IDENTIFIER);
			return;
		}
		const id = this.t[i].raw.slice(1, -1)
		if (dest === IdentType.BINDINGS && tokName) {
			this.m.bindings.set(tokName.name, id);
		} else if (dest === IdentType.INTO) {
			this.m.into = id;
		} else if (dest === IdentType.INTOSECRET) {
			this.m.intoSecret = id;
		} else if (dest === IdentType.OPEN) {
			this.m.open = id;
		} else if (dest === IdentType.CONNECT) {
			this.m.connect = id;
		}
	}
}

const openConnectParser = (m: Match, i: number, errorHandler: ErrorHandler): number => {
	const k = m.key;
	// open '' and | connect to '' and
	if (k.openconnect === TokenType.OPEN) {
		errorHandler.expect(++i, TokenType.OPEN);
		errorHandler.isIdent(++i, IdentType.OPEN);
		errorHandler.expect(++i, TokenType.AND);
	} else if (k.openconnect === TokenType.CONNECT) {
		errorHandler.expect(++i, TokenType.CONNECT);
		errorHandler.expect(++i, TokenType.TO);
		errorHandler.isIdent(++i, IdentType.CONNECT);
		errorHandler.expect(++i, TokenType.AND);
	}
	return i;
}

const outputParser = (m: Match, t: Token[], i: number, errorHandler: ErrorHandler): void => {
	const lineNo = m.lineNo;
	const ident = t[t.length - 1];
	if (!m.into && !m.intoSecret && t.length - i >= 5 && ident?.isIdent) {
		for (++i; i < t.length - 5; ++i) {
			m.err.push({
				message: ParseError.extra(t[i] as Token),
				lineNo,
				start: (t[i] as Token).start,
				end: (t[i] as Token).end
			});
		}

		const baseOutput = [TokenType.AND, TokenType.OUTPUT, TokenType.INTO];
		let assign = (val: string) => (m.into = val);
		let length = t.length - i;

		if (length == 5) {
			const isShiftedBaseOutput = baseOutput.every((name, index) => {
				return t[i+1+index]?.name == name;
			});
			if (isShiftedBaseOutput) {
				m.err.push({
					message: ParseError.extra(t[i] as Token),
					lineNo,
					start: (t[i] as Token).start,
					end: (t[i] as Token).end
				});
				length = 4;
			} else {
				baseOutput.splice(2, 0, TokenType.SECRET);
				assign = (val: string) => (m.intoSecret = val);
			}
		}
		let isValid = true;
		baseOutput.forEach((name, index) => {
			isValid = errorHandler.expect(t.length - length + index, name) && isValid
		});
		if (isValid) assign(ident.raw.slice(1, -1));
	} else {
		for (++i; i < t.length; ++i) {
			m.err.push({
				message: ParseError.extra(t[i] as Token),
				lineNo,
				start: (t[i] as Token).start,
				end: (t[i] as Token).end
			});
		}
	}
}

const givenThenParser = (m: Match, t: Token[], curErrLen?: number): boolean => {
	const errorHandler = new ErrorHandler(m, t, curErrLen);
	const k = m.key;
	let i = 0;
	// I
	if (t[i+1]?.raw == TokenType.I) {
		++i;
	} else {
		// understand if I is missing or written wrong
		if (
			t[i+1]?.name == TokenType.CONNECT
			|| t[i+1]?.name == TokenType.OPEN
			|| t[i+1]?.name == TokenType.SEND
			|| t[i+1]?.name == k.phrase.split(' ')[0]
		) {
			m.err.push(
				{message: ParseError.missing(t[i] as Token, TokenType.I), lineNo: m.lineNo},
			);
		} else {
			errorHandler.report(++i, TokenType.I);
		}
	}

	// open '' and | connect to '' and
	i = openConnectParser(m, i, errorHandler);
	// Send $buzzword 'ident' And
	// TODO: allow spaces in between params
	const params = new Set(k.params);
	k.params?.forEach(() => {
		errorHandler.expect(++i, TokenType.SEND);
		const tokName = t[++i];
		if (tokName && params.has(tokName.name)) {
			params.delete(tokName.name);
		} else {
			const [first, ...rest] = [...params.values()] as [string, ...string[]];
			errorHandler.report(i, first, ...rest);
		}

		errorHandler.isIdent(++i, IdentType.BINDINGS, tokName);
		errorHandler.expect(++i, TokenType.AND);
	});
	// $buzzwords
	k.phrase.split(' ').forEach((name) => errorHandler.expect(++i, name));
	// Output Into 'ident' || Output Secret Into 'ident'
	outputParser(m, t, i, errorHandler);

	if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
	return (curErrLen !== undefined && m.err.length < curErrLen);
}

const prepareComputeParser = (m: Match, t: Token[], curErrLen?: number): boolean => {
	const errorHandler = new ErrorHandler(m, t, curErrLen);
	const k = m.key;
	let i = 0;
	// 'ident'|secret 'ident'|undefined
	const secondToken = t[i+1];
	if(secondToken?.isIdent) {
		++i;
		m.into = secondToken.raw.slice(1, -1);
		errorHandler.expect(++i, TokenType.COLON);
	} else if (secondToken?.name === TokenType.SECRET) {
		++i;
		errorHandler.isIdent(++i, IdentType.INTOSECRET);
		errorHandler.expect(++i, TokenType.COLON);
	}
	// open '' and | connect to '' and
	i = openConnectParser(m, i, errorHandler);
	// $buzzwords
	k.phrase.split(' ').forEach((name) => errorHandler.expect(++i, name));
	// With $buzzword 'ident', | Where $buzzword is 'ident',
	// TODO: allow spaces in between params
	const params = new Set(k.params);
	if (k.params) {
		const whereWith = t[++i]?.name;
		if (whereWith !== TokenType.WHERE && whereWith !== TokenType.WITH)
			errorHandler.report(i, TokenType.WITH, TokenType.WHERE);
		k.params.forEach((_, index) => {
			const tokName = t[++i];
			if (tokName && params.has(tokName.name)) {
				params.delete(tokName.name);
			} else {
				const [first, ...rest] = [...params.values()] as [string, ...string[]];
				errorHandler.report(i, first, ...rest);
			}
			if (whereWith == TokenType.WHERE) errorHandler.expect(++i, TokenType.IS);
			errorHandler.isIdent(++i, IdentType.BINDINGS, tokName);
			if (index+1 !== k.params?.length) errorHandler.expect(++i, TokenType.COMMA);
		})
	}
	// Output Into 'ident' || Output Secret Into 'ident'
	outputParser(m, t, i, errorHandler);

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

	if (!t[0]) {
		cst.errors.push({ message: ParseError.missing(lineNo, 'Given I', 'Then I', 'Prepare', '...'), lineNo });
		return cst;
	}

	let name = t[0].name;
	let isGivenThen = name === TokenType.GIVEN || name === TokenType.THEN;
	let isPrepareCompute = name === TokenType.PREPARE || name === TokenType.BEFORE || name === TokenType.COMPUTE || name === TokenType.AFTER;
	let openConnect: TokenType.OPEN | TokenType.CONNECT | undefined;
	if(isGivenThen) {
		cst.givenThen = name as TokenType.GIVEN | TokenType.THEN;
		if (t[2]?.raw === TokenType.OPEN || t[2]?.raw === TokenType.CONNECT) openConnect = t[2]?.raw;
	} else {
		if (name.endsWith(TokenType.COLON)) name = name.slice(0, -1);
		if (isPrepareCompute) {
			cst.givenThen = name === TokenType.PREPARE || name === TokenType.BEFORE ? TokenType.GIVEN : TokenType.THEN;
			// Prepare: connect/open
			// Prepare 'ident' : connect/open
			// Prepare secret 'ident': connect/open
			const openOrConnectTokens = [t[1]?.raw, t[3]?.raw, t[4]?.raw];
			if (openOrConnectTokens.includes(TokenType.CONNECT)) openConnect = TokenType.CONNECT;
			else if (openOrConnectTokens.includes(TokenType.OPEN)) openConnect = TokenType.OPEN;
		} else {
			const closestMatch = closest(name, [TokenType.GIVEN, TokenType.THEN, TokenType.PREPARE, TokenType.BEFORE, TokenType.COMPUTE, TokenType.AFTER]);
			if (closestMatch === TokenType.GIVEN || closestMatch === TokenType.THEN) {
				isGivenThen = true;
				cst.errors.push({ message: ParseError.wrong(t[0], TokenType.GIVEN, TokenType.THEN), lineNo, start: t[0].start, end: t[0].end });
			} else {
				isPrepareCompute = true;
				cst.errors.push({ message: ParseError.wrong(t[0], TokenType.PREPARE, TokenType.BEFORE, TokenType.COMPUTE, TokenType.AFTER), lineNo, start: t[0].start, end: t[0].end });
			}
		}
	}

	p.forEach(([k]) => {
		// check open and connect statement only against the correct statements
		if(openConnect && (openConnect !== k.openconnect)) return;

		const parseStatement = (parser: (m: Match, t: Token[], errLen?: number) => boolean) => {
			try {
				const match: Match = { key: k, bindings: new Map(), err: [], lineNo };
				if (parser(match, t, cst.matches[0]?.err.length)) cst.matches.length = 0;
				cst.matches.push(match);
			} catch (e) {
				if (e !== lemmeout) throw e;
			}
		};

		if (isGivenThen) parseStatement(givenThenParser);
		if (isPrepareCompute) parseStatement(prepareComputeParser);
	});
	return cst;
};
