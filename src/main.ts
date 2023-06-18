import { Lexer, createToken } from 'chevrotain';
export const Identifier = createToken({
	name: 'Identifier',
	pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/
});

export const Comment = createToken({
	name: 'Comment',
	pattern: /#[^\n\r]*/,
	group: 'comments'
});

export const WhiteSpace = createToken({
	name: 'WhiteSpace',
	pattern: /\s+/,
	group: Lexer.SKIPPED
});

export const tokenize = (contract: string) => {
	const tokens = [WhiteSpace, Identifier, Comment];
	const Scanner = new Lexer(tokens);

	const result = Scanner.tokenize(contract);

	// if (result.errors.length > 0) {
	// 	const msg = result.errors
	// 		.map((error) => `[${error.line}:${error.column}] ${error.message}`)
	// 		.join(', ');
	// 	throw new Error(`Error tokenizing the text. ${msg}`);
	// }

	return result;
};
