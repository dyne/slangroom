import { createToken, Lexer } from '@slangroom/deps/chevrotain';

export const Save = createToken({
	name: 'Save',
	pattern: /save/i,
});

export const Read = createToken({
	name: 'Read',
	pattern: /read/i,
});

export const Connect = createToken({
	name: 'Connect',
	pattern: /connect/i,
});

export const Pass = createToken({
	name: 'Pass',
	pattern: /pass/i,
});

export const Send = createToken({
	name: 'Send',
	pattern: /send/i,
});

export const To = createToken({
	name: 'To',
	pattern: /to/i,
});

export const And = createToken({
	name: 'And',
	pattern: /and/i,
});

export const Into = createToken({
	name: 'Into',
	pattern: /into/i,
});

export const Within = createToken({
	name: 'Within',
	pattern: /within/i,
});

export const Buzzword = createToken({
	name: 'Buzzword',
	pattern: /[a-z0-9]+/i,
});

export const Identifier = createToken({
	name: 'Identifier',
	pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
});

export const Whitespace = createToken({
	name: 'Whitespace',
	pattern: /\s+/,
	group: Lexer.SKIPPED,
});

export const allTokens = [
	Whitespace,
	Read,
	Save,
	Connect,
	Into,
	Within,
	And,
	To,
	Identifier,
	Send,
	Pass,
	Buzzword,
];
