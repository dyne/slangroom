import { vocab } from '@slangroom/fs/tokens';
import { Lexer } from '@slangroom/deps/chevrotain';

const FsLexer = new Lexer(vocab);

/**
 * Lexes the given statement for filesystems statements.
 *
 * @param statement is the statement ignored by Zenroom.
 * @returns the tokens of the lexed result.
 **/
export const lex = (statement: string) => FsLexer.tokenize(statement);
