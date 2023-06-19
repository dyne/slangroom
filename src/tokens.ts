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

export const Ignored = createToken({
	name: 'Ignored',
	pattern: /(?<=\[W\] {2}Zencode pattern ignored: ).*/,
	line_breaks: false
});
