import { ZenroomParams } from '../shared/zenroom';
import { vocab } from './tokens';
import { getIgnoredStatements } from '../ignored';

import { Lexer } from 'chevrotain';

const FsLexer = new Lexer(vocab);

/**
 * Lexes the input text for filesystem statements.
 *
 * @param contract the zencode contract to be lexed.
 * @returns the lexed result.
 */
export const lex = async (contract: string, params?: ZenroomParams) => {
	const ignored = await getIgnoredStatements(contract, params);
	return FsLexer.tokenize(ignored.join('\n'));
};
