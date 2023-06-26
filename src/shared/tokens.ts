import { Lexer, createToken } from 'chevrotain';

/**
 * Whitespace of any kind (blanks, tabs, and newlines).
 */
export const Whitespace = createToken({
	name: 'Whitespace',
	pattern: /\s+/,
	group: Lexer.SKIPPED
});

/**
 * Shell-like comments using '#' to mark what's after it as comments.
 *
 * Spans across the entire line, as expected.
 */
export const Comment = createToken({
	name: 'Comment',
	pattern: /#[^\n\r]*/,
	group: 'comments'
});

/**
 * Identifiers in single quotes, such as 'foo' and 'bar'.
 *
 * Escaped characters '\b', '\f', '\n', '\r', '\t', and '\v' are also
 * accepted.
 * Unicode characters of the format '\uXXXX' (where X is a hexedecimal
 * digit) are also accepted.
 */
export const Identifier = createToken({
	name: 'Identifier',
	pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/
});

// TODO: move main's tests into this one's tests.
