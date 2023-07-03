import { Whitespace, Comment, Identifier } from '@slangroom/shared';
import { createToken } from '@slangroom/deps/chevrotain';

// TODO: maybe this should be put in shared and/or the "I" part should be split up.
/**
 * The "Then I" statement.
 */
export const ThenI = createToken({
	name: 'ThenI',
	pattern: /Then I/,
});

/**
 * The "save the" statement, used to write files to the filesystems.
 */
export const SaveThe = createToken({
	name: 'SaveThe',
	pattern: /save the/,
});

/** * The "into the file" statement, used to indicate the file to which to
 * write.
 */
export const IntoTheFile = createToken({
	name: 'IntoTheFile',
	pattern: /into the file/,
});

/**
 * Vocabulary to perform filesystems actions.
 */
export const vocab = [Whitespace, Comment, ThenI, SaveThe, IntoTheFile, Identifier];
