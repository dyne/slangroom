import { Whitespace, Comment, Identifier } from '@slangroom/shared';
import { createToken } from '@slangroom/deps/chevrotain';

/**
 * The "Then" statement.
 */
export const Then = createToken({
	name: 'Then',
	pattern: /Then/,
});

/**
 * The "and" statement.
 */
export const And = createToken({
	name: 'and',
	pattern: /and/,
});

/**
 * The selfish "I" statement.
 */
export const I = createToken({
	name: 'I',
	pattern: /I/,
});

/**
 * The "save the" statement, used to write files to the filesystems.
 */
export const SaveThe = createToken({
	name: 'SaveThe',
	pattern: /save the/,
});

/**
 * The "into the file" statement, used to indicate the file to which to
 * write.
 */
export const IntoTheFile = createToken({
	name: 'IntoTheFile',
	pattern: /into the file/,
});

/**
 * Vocabulary to perform filesystems actions.
 */
export const vocab = [Whitespace, Comment, Then, And, I, SaveThe, IntoTheFile, Identifier];
