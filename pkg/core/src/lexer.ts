// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later
// read the version from the package.json
import packageJson from '@slangroom/core/package.json' with { type: 'json' };
import { errorColor } from '@slangroom/shared';

/**
 * A whitespace-separated string of characters with position information.
 *
 * @remarks
 * The whole instance of of this class must be thought as a concrete, immutable
 * unit.
 *
 * When that string of characters corresponds to an identifier, which is wrapped
 * in a pair of single-quotes, the whitespace inside the quotes remains intact.
 *
 * @example
 * `love` and `Asche` are tokens, so are `'transfer id'` and `'http method'`.
 */
export class Token {
	/**
	 * The raw string of a token, such as `Asche`.
	 */
	readonly raw: string;

	/**
	 * The line number of the token.
	 */
	readonly lineNo: number;

	/**
	 * The lowercased version of {@link raw} string, such as `asche`.
	 */
	readonly name: string;

	/**
	 * The start position of the token in the given line, must be non-negative.
	 */
	readonly start: number;

	/**
	 * The end position of the token in the given line, must be >= {@link start}.
	 */
	readonly end: number;

	/**
	 * Whether this token is an identifier or not.  It is an identifier if the
	 * first character of {@link raw} is a single-quote.
	 */
	readonly isIdent: boolean;

	/**
	 * Creates a new instance of {@link Token}.
	 *
	 * @throws {@link Error}
	 * If {@link raw} is empty.
	 *
	 * @throws {@link Error}
	 * If {@link lineNo} is not positive.
	 *
	 * @throws {@link Error}
	 * If {@link start} is negative.
	 *
	 * @throws {@link Error}
	 * If {@link end} is less than {@link start}.
	 */
	constructor(raw: string, lineNo: number, start: number, end: number) {
		if (!raw) throw new Error('raw cannot be empty string');
		if (lineNo <= 0) throw new Error('lineNo must be positive');
		if (start < 0) throw new Error('start cannot be negative');
		if (end < start) throw new Error('end cannot be less than start');

		this.raw = raw;
		this.lineNo = lineNo;
		this.start = start;
		this.end = end;
		this.name = this.raw.toLowerCase();
		this.isIdent = this.raw.charAt(0) === "'";
	}
}

/**
 * An error encountered during the lexican analysis phrase.
 *
 * @privateRemarks
 * Currently, we only have an error of unclosed single-quotes.  I don't know if
 * we'll ever need anything other than this.
 */
export class LexError extends Error {
	constructor(t: Token) {
		super();
		this.name = 'LexError @slangroom/core@' + packageJson.version;
		this.message = `at ${t.lineNo}:${t.start + 1}-${t.end + 1}\n unclosed single-quote ${errorColor(t.raw)}`;
	}
}

/**
 * Result of a lexer execution.
 */
export type LexResult = LexOk | LexErr;

/**
 * Result of a lexer execution, indicating success.
 */
export type LexOk = { ok: true, value: [Token[], number]};

/**
 * Result of a lexer execution, indicating failure.
 */
export type LexErr = { ok: false, error: {message: LexError, lineNo: number, start: number, end: number}};


/**
 * Analyzes the given line lexically to generate an array of tokens.
 *
 * @return {LexOk | LexErr} based on the fact that the line is valid or not
 */
export const lex = (stmt: string, lineNo: number): LexResult => {
	const tokens: Token[] = [];
	const c = [...stmt];
	let raw = '';
	let i = 0;

	while (i < c.length) {
		while (c[i] === ' ' || c[i] === '\t') ++i;

		if (c[i] === "'") {
			const start = i;
			raw += c[i++];
			while (i < c.length && c[i] !== "'") raw += c[i++];
			if (i >= c.length) return { ok: false, error: { message: new LexError(new Token(raw, lineNo, start, c.length - 1)), lineNo, start, end: c.length - 1 }};
			raw += c[i++];
			tokens.push(new Token(raw, lineNo, start, i - 1));
			raw = '';
		} else {
			const start = i;
			while (i < c.length && c[i] !== ' ' && c[i] !== '\t' && c[i] !== "'") raw += c[i++];
			if (raw.length) tokens.push(new Token(raw, lineNo, start, i - 1));
			raw = '';
		}
	}

	return { ok: true, value: [tokens, lineNo]};
};
