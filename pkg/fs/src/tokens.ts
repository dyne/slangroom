import { Whitespace, Comment, Identifier, Then, I } from '@slangroom/shared';
import { createToken } from '@slangroom/deps/chevrotain';

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
export const vocab = [Whitespace, Comment, Then, I, SaveThe, IntoTheFile, Identifier];
