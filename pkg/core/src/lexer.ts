import { allTokens } from '@slangroom/core/tokens';
import { Lexer as L } from '@slangroom/deps/chevrotain';

const Lexer = new L(allTokens);

/**
 * Lexes the given line.
 */
export const lex = (line: string) => Lexer.tokenize(line);
