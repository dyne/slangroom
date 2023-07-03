import { vocab } from './tokens';

import { type ZenroomParams } from '@slangroom/shared';
import { getIgnoredStatements } from '@slangroom/ignored';
import { Lexer } from '@slangroom/deps/chevrotain';

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
