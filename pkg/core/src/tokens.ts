import { createToken, Lexer } from '@slangroom/deps/chevrotain';

/**
 * The verb "Save".
 */
export const Save = createToken({
	name: 'Save',
	pattern: /save/i,
});

/**
 * The verb "Read"
 */
export const Read = createToken({
	name: 'Read',
	pattern: /read/i,
});

/**
 * The verb "Connect"
 */
export const Connect = createToken({
	name: 'Connect',
	pattern: /connect/i,
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

export const allTokens = [Whitespace, Read, Save, Connect, Into, Within, And, Identifier, Buzzword];
