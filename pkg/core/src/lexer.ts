import { Lexicon } from '@slangroom/core';
import { Lexer } from '@slangroom/deps/chevrotain';

/**
 * Lexes the given line.
 */
export const lex = (lexicon: Lexicon, line: string) => {
	const lexer = new Lexer(lexicon.tokens);
	return lexer.tokenize(line);
};
