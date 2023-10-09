import { Lexer as L } from '@slangroom/deps/chevrotain';
import { allTokens } from '@slangroom/http/tokens';

const Lexer = new L(allTokens);
export const lex = (line: string) => Lexer.tokenize(line);
