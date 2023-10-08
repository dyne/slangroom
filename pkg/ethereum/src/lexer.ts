import { Lexer as L } from '@slangroom/deps/chevrotain';
import { allTokens } from '@slangroom/ethereum';

const Lexer = new L(allTokens);

/**
 * Lexes the given line.
 */
export const lex = (line: string) => Lexer.tokenize(line);
