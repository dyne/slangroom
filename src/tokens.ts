import { Lexer, createToken } from 'chevrotain';

const skipping = 'given when then and I that valid all inside am an a'.split(' ');
const capitalize = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`;

export const SkippedTokens = skipping.map((t) =>
	createToken({ name: capitalize(t), pattern: new RegExp(`${t} `), group: Lexer.SKIPPED })
);

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
	pattern: /(?<=\[W\]  Zencode pattern ignored: ).*/,
	line_breaks: false
});
