// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
	 * If {@link start} is negative.
	 *
	 * @throws {@link Error}
	 * If {@link end} is less than {@link start}.
	 */
	constructor(raw: string, start: number, end: number) {
		if (!raw) throw new Error('raw cannot be empty string');
		if (start < 0) throw new Error('start cannot be negative');
		if (end < start) throw new Error('end cannot be less than start');

		this.raw = raw;
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
		this.name = 'LexError';
		this.message = `unclosed single-quote at ${t.start},${t.end}: ${t.raw}`;
	}
}

/**
 * Analyzes the given line lexically to generate an array of tokens.
 *
 * @throws {@link LexError}
 * If any error during lexing is encountered.
 */
export const lex = (line: string): Token[] => {
	const tokens: Token[] = [];
	const c = [...line];
	let raw = '';
	let i = 0;

	while (i < c.length) {
		while (c[i] === ' ' || c[i] === '\t') ++i;

		if (c[i] === "'") {
			const start = i;
			raw += c[i++];
			while (i < c.length && c[i] !== "'") raw += c[i++];
			if (i >= c.length) throw new LexError(new Token(raw, start, c.length - 1));
			raw += c[i++];
			tokens.push(new Token(raw, start, i - 1));
			raw = '';
		} else {
			const start = i;
			while (i < c.length && c[i] !== ' ' && c[i] !== '\t' && c[i] !== "'") raw += c[i++];
			if (raw.length) tokens.push(new Token(raw, start, i - 1));
			raw = '';
		}
	}

	return tokens;
};
