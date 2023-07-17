import { vocab } from './tokens';

import { zencodeExec, type ZenroomParams, type ZenroomOutput } from '@slangroom/shared';
import { Lexer } from '@slangroom/deps/chevrotain';

/**
 * ZenroomOutput with ignored statements attached to it.
 */
type IgnoredResult = {
	zenroom: ZenroomOutput;
	statements: string[];
};

const IgnoredLexer = new Lexer(vocab);

/**
 * Finds statements ignored by Zenroom in the provided contract.
 *
 * If no statement is found, then that means the contract was executed with
 * only statements found in Zenroom itself.
 *
 * @param contract is the Zenroom contract.
 * @param params is the parameters of Zenroom, such as data and keys.
 * @returns the Zenroom output along with the ignored statements.
 */
export const getIgnoredStatements = async (
	contract: string,
	params?: ZenroomParams
): Promise<IgnoredResult> => {
	const zen = await zencodeExec(contract, params);
	const lexed = IgnoredLexer.tokenize(zen.logs);
	const ignoreds = lexed.tokens.map((s) => s.image);
	return {
		zenroom: zen,
		statements: ignoreds,
	};
};
