import { Lexer } from 'chevrotain';
import { zencode_exec } from 'zenroom';
import { Comment, Identifier, Ignored, WhiteSpace } from './tokens';

export const tokenize = (contract: string) => {
	const tokens = [WhiteSpace, Identifier, Comment];
	const Scanner = new Lexer(tokens);

	return Scanner.tokenize(contract);

	// if (result.errors.length > 0) {
	// 	const msg = result.errors
	// 		.map((error) => `[${error.line}:${error.column}] ${error.message}`)
	// 		.join(', ');
	// 	throw new Error(`Error tokenizing the text. ${msg}`);
	// }
};

export const scan = async (contract: string, data?: string) => {
	const { logs } = await zencode_exec(contract, { data });
	const Scanner = new Lexer([WhiteSpace, Ignored]);
	const sentences = Scanner.tokenize(logs);
	return sentences.tokens.map((s) => s.image);
};
