export class Token {
	readonly name: string;
	readonly isIdent: boolean;

	constructor(
		readonly raw: string,
		readonly start: number,
		readonly end: number,
	) {
		this.name = this.raw.toLowerCase();
		this.isIdent = this.raw.charAt(0) === "'";
	}
}

export class LexError extends Error {
	constructor(t: Token) {
		super();
		this.name = 'LexError';
		this.message = `unclosed single-quote at ${t.start},${t.end}: ${t.raw}`;
	}
}

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
