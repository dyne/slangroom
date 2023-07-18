import { vocab } from './tokens';

import { zencodeExec, type ZenroomParams } from '@slangroom/shared';
import { Lexer } from '@slangroom/deps/chevrotain';

const IgnoredLexer = new Lexer(vocab);

/**
 * Finds statements ignored by Zenroom in the provided contract.
 *
 * If no statement is found, then that means the contract was executed with
 * only statements found in Zenroom itself, thus no customization is possible.
 *
 * @param contract is the Zenroom contract.
 * @param params is the parameters of Zenroom, such as data and keys.
 * @returns the array of ignored statements.
 */
export const getIgnoredStatements = async (
	contract: string,
	params?: ZenroomParams
): Promise<string[]> => {
	// TODO: the zencodeExec() call could potentially be optimized, as
	// zencodeExec() parses the output result.  Keep in mind: optimization bad.
	const { logs } = await zencodeExec(contract, params);
	const lexed = IgnoredLexer.tokenize(logs);
	return lexed.tokens.map((s) => s.image);
};
