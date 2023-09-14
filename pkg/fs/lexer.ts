import { vocab } from './tokens';

import { Lexer } from 'chevrotain';

const FsLexer = new Lexer(vocab);

/**
 * Lexes the given statement for filesystems statements.
 *
 * @param statement is the statement ignored by Zenroom.
 * @returns the tokens of the lexed result.
 **/
export const lex = (statement: string) => FsLexer.tokenize(statement);
