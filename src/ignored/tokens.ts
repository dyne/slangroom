import { Whitespace } from '../shared/tokens';

import { createToken } from 'chevrotain';

/**
 * Statements ignored by Zenroom.
 *
 * When Zenroom encounters with a statement it doesn't understand, it
 * prints that statement out on stderr in the following format (mind the
 * two spaces between "[W]" and "Zencode"):
 *
 * [W]  Zencode pattern ignored: The pattern that doesn't exist goes here
 */
export const IgnoredStatements = createToken({
	name: 'IgnoredStatements',
	pattern: /(?<=\[W\]  Zencode pattern ignored: ).*/,
	line_breaks: false
});

/**
 * Vocabulary to find ignored statements.
 */
export const vocab = [Whitespace, IgnoredStatements];
