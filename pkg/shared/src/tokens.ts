import { Lexer, createToken } from '@slangroom/deps/chevrotain';

/**
 * Whitespace of any kind (blanks, tabs, and newlines).
 */
export const Whitespace = createToken({
	name: 'Whitespace',
	pattern: /\s+/,
	group: Lexer.SKIPPED,
});

/**
 * Shell-like comments using '#' to mark what's after it as comments.
 *
 * Spans across the entire line, as expected.
 */
export const Comment = createToken({
	name: 'Comment',
	pattern: /#[^\n\r]*/,
	group: 'comments',
});

/**
 * The most selfish constants of all.  The evilful.
 *
 * Unlike other statements, this must be case-sensitive.
 */
export const I = createToken({
	name: 'I',
	pattern: /I/,
});

/**
 * The statement that follows one of Given, When, or Then.
 *
 * It can optionally followed by itself, but the top of the list must be one of
 * Given, When, or Then.
 *
 * Custom statements MUST run the And statements according to the following
 * Given, When, or Then.
 */
export const And = createToken({
	name: 'And',
	pattern: /and/i,
});

/**
 * The Given (initial) stage of Zenroom contracts.
 *
 * Custom statements MUST run before the actual execution.
 */
export const Given = createToken({
	name: 'Given',
	pattern: /given/i,
});

/**
 * The When (middle) stage of Zenroom contracts.
 *
 * Custom statements MUST run before the actual execution.
 */
export const When = createToken({
	name: 'When',
	pattern: /when/i,
});

/**
 * The Then (last) stage of Zenroom contracts.
 *
 * Custom statements MUST run AFTER the actual execution.
 */
export const Then = createToken({
	name: 'Then',
	pattern: /then/i,
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
	pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
});
