import { createToken, Lexer, type TokenType } from '@slangroom/deps/chevrotain';

/**
 * The central place to create our lexicon/vocabulary.
 *
 * It was needed because the lexer and the parser will need a way to have access
 * to a shared but dynamic set of tokens.
 */
export class Lexicon {
	#store = new Map<string, TokenType>();

	constructor() {
		this.#store.set(
			'whitespace',
			createToken({
				name: 'Whitespace',
				pattern: /\s+/,
				group: Lexer.SKIPPED,
			})
		);

		this.#store.set(
			'comment',
			createToken({
				name: 'Comment',
				pattern: /#[^\n\r]*/,
				group: 'comments',
			})
		);

		this.#store.set(
			'identifier',
			createToken({
				name: 'Identifier',
				pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
			})
		);
	}

	/**
	 * Returns the token by name and create it if it doesn't exist.
	 *
	 * @returns the token found in the lexicon or created if it isn't.
	 */
	token(name: string) {
		const first = name[0]?.toUpperCase();
		const rest = name.slice(1).toLowerCase();
		if (!first) throw new Error('name must not be empty string');

		const tokname = `${first}${rest}`;
		const tokregex = tokname.toLowerCase();
		const found = this.#store.get(tokregex);
		if (found) return found;

		const tok = createToken({
			name: tokname,
			pattern: new RegExp(tokregex, 'i'),
		});
		this.#store.set(tokregex, tok);
		return tok;
	}

	/**
	 * The array of all unique lexemes/tokens.
	 */
	get tokens() {
		// remember: values() returns in insertion order
		return [...this.#store.values()];
	}
}
