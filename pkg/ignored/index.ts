import { vocab } from './tokens';

import { type ZenroomParams, zencodeExec } from '@slangroom/shared';
import { Lexer } from '@slangroom/deps/chevrotain';

const IgnoredLexer = new Lexer(vocab);

/**
 * Finds statements ignored by Zenroom in the provided contract.
 *
 * @param contract is the Zenroom contract.
 * @param params is the parameters of Zenroom, such as data and keys.
 * @returns the ignored statements.
 */
export const getIgnoredStatements = async (contract: string, params?: ZenroomParams) => {
	const { logs } = await zencodeExec(contract, params);
	const lexed = IgnoredLexer.tokenize(logs);
	return lexed.tokens.map((s) => s.image);
};
