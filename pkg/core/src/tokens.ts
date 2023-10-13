import { Whitespace, Comment } from '@slangroom/shared';
import { createToken } from '@slangroom/deps/chevrotain';

export { Whitespace } from '@slangroom/shared';

export const Buzzword = createToken({
	name: 'Buzzword',
	pattern: /[a-z0-9]+/i,
});

export const Identifier = createToken({
	name: 'Identifier',
	pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
});

export const Connect = createToken({
	name: 'Connect',
	pattern: /connect/i,
});

export const Open = createToken({
	name: 'Open',
	pattern: /open/i,
});

export const To = createToken({
	name: 'To',
	pattern: /to/i,
});

export const Send = createToken({
	name: 'Send',
	pattern: /send/i,
});

export const Pass = createToken({
	name: 'Pass',
	pattern: /pass/i,
});

export const Output = createToken({
	name: 'Output',
	pattern: /output/i,
});

export const Into = createToken({
	name: 'Into',
	pattern: /into/i,
});

export const And = createToken({
	name: 'And',
	pattern: /and/i,
});

export const allTokens = [
	Whitespace,
	Connect,
	Open,
	Into,
	Output,
	And,
	To,
	Identifier,
	Send,
	Pass,
	Buzzword,
	Comment,
];
