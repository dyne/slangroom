import { Lexer } from '@slangroom/deps/chevrotain';
import { vocab } from '@slangroom/ignored/tokens';
import { zencodeExec, ZenroomError, type ZenroomParams } from '@slangroom/shared';

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
	// Since we want to get the list of ignored statements, we don't want to
	// throw if Zenroom execution fails (but we do fail if something other than
	// that happens).  When Zenroom fails, the ZenroomError type's message
	// contains the logs.
	let logs: string;
	try {
		// TODO: the zencodeExec() call could potentially be optimized, as
		// zencodeExec() parses the output result.  Keep in mind: optimization bad.
		const zout = await zencodeExec(contract, params);
		logs = zout.logs;
	} catch (e) {
		if (!(e instanceof ZenroomError))
			throw e;
		logs = e.message;
	}
	const lexed = IgnoredLexer.tokenize(logs);
	return lexed.tokens.map((s) => s.image);
};
