// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { lex, parse, ParseError, Plugin, Token } from '@slangroom/core';

test('parser works', (t) => {
	const p = new Plugin();

	p.new('love asche', (ctx) => ctx.pass(null));
	p.new('a b c', (ctx) => ctx.pass(null));
	p.new('domates biber patlican', (ctx) => ctx.pass(null));
	p.new('open', 'write file', (ctx) => ctx.pass(null));
	p.new('connect', ['object'], 'send http request', (ctx) => ctx.pass(null));
	p.new(['things'], 'to do', (ctx) => ctx.pass(null));
	p.new(['foo', 'bar'], 'testing params order', (ctx) => ctx.pass(null));

	Object.entries<ReturnType<typeof parse>>({
		'': {
			errors: [{message: ParseError.missing(1, 'Given I', 'Then I'), lineNo: 1}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [{message: ParseError.missing(1, 'love'), lineNo: 1}, {message: ParseError.missing(1, 'asche'), lineNo: 1}],
				},
			],
		},
		G: {
			errors: [
				{message: ParseError.wrong(new Token('G', 1, 0, 0), 'given', 'then'), lineNo: 1, start: 0, end: 0},
				{message: ParseError.missing(new Token('G', 1, 0, 0), 'I'), lineNo: 1, start: 0, end: 0},
			],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.missing(1, 'love'), lineNo: 1},
						{message: ParseError.missing(1, 'asche'), lineNo: 1}
					],
				},
			],
		},
		t: {
			errors: [
				{message: ParseError.wrong(new Token('t', 1, 0, 0), 'given', 'then'), lineNo: 1, start: 0, end: 0},
				{message: ParseError.missing(new Token('t', 1, 0, 0), 'I'), lineNo: 1, start: 0, end: 0},
			],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.missing(1, 'love'), lineNo: 1},
						{message: ParseError.missing(1, 'asche'), lineNo: 1}
					],
				},
			],
		},

		'given Me': {
			givenThen: 'given',
			errors: [{message: ParseError.wrong(new Token('Me', 1, 6, 7), 'I'), lineNo: 1, start: 6, end: 7}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.missing(1, 'love'), lineNo: 1},
						{message: ParseError.missing(1, 'asche'), lineNo: 1}
					],
				},
			],
		},
		'Then myself': {
			givenThen: 'then',
			errors: [{message: ParseError.wrong(new Token('myself', 1, 5, 10), 'I'), lineNo: 1, start: 5, end: 10}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.missing(1, 'love'), lineNo: 1},
						{message: ParseError.missing(1, 'asche'), lineNo: 1}
					],
				},
			],
		},

		'Given I love notAsche': {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('notAsche', 1, 13, 20), 'asche'), lineNo: 1, start: 13, end: 20}],
				},
			],
		},
		'Then I a b foobar': {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('foobar', 1, 11, 16), 'c'), lineNo: 1, start: 11, end: 16}],
				},
			],
		},
		'giVen I domates patates biber': {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						phrase: 'domates biber patlican',
					},
					bindings: new Map(),
					err: [
						{message: ParseError.wrong(new Token('patates', 1, 16, 22), 'biber'), lineNo: 1, start: 16, end: 22},
						{message: ParseError.wrong(new Token('biber', 1, 24, 28), 'patlican'), lineNo: 1, start: 24, end: 28}
					],
				},
			],
		},
		"Given I open 'xfiles' and write files": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [{message: ParseError.wrong(new Token('files', 1, 32, 36), 'file'), lineNo: 1, start: 32, end: 36}],
				},
			],
		},

		'Then I Like Asche': {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('Like', 1, 7, 10), 'love'), lineNo: 1, start: 7, end: 10}],
				},
			],
		},
		'Given I a biber c': {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('biber', 1, 10, 14), 'b'), lineNo: 1, start: 10, end: 14}],
				},
			],
		},
        'then I domates b patates': {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [
						{message: ParseError.wrong(new Token('domates', 1, 7, 13), 'a'), lineNo: 1, start: 7, end: 13},
						{message: ParseError.wrong(new Token('patates', 1, 17, 23), 'c'), lineNo: 1, start: 17, end: 23},
					],
				},
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [
						{message: ParseError.wrong(new Token('b', 1, 15, 15), 'biber'), lineNo: 1, start: 15, end: 15},
						{message: ParseError.wrong(new Token('patates', 1, 17, 23), 'patlican'), lineNo: 1, start: 17, end: 23}
					],
				},
			],
		},

		'given i love Asche and so': {
			givenThen: 'given',
			errors: [{message: ParseError.wrong(new Token('i', 1, 6, 6), 'I'), lineNo: 1, start: 6, end: 6}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 19, 21)), lineNo: 1, start: 19, end: 21},
						{message: ParseError.extra(new Token('so', 1, 23, 24)), lineNo: 1, start: 23, end: 24}
					],
				},
			],
		},
		'Then i a b c and d': {
			givenThen: 'then',
			errors: [{message: ParseError.wrong(new Token('i', 1, 5, 5), 'I'), lineNo: 1, start: 5, end: 5}],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 13, 15)), lineNo: 1, start: 13, end: 15},
						{message: ParseError.extra(new Token('d', 1, 17, 17)), lineNo: 1, start: 17, end: 17}
					],
				},
			],
		},
		'Then I domates biber patlican patates': {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [{message: ParseError.extra(new Token('patates', 1, 30, 36)), lineNo: 1, start: 30, end: 36}],
				},
			],
		},
		"Given I open 'xfiles' and write file and stuff": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [
						{message: ParseError.extra(new Token('and', 1, 37, 39)), lineNo: 1, start: 37, end: 39},
						{message: ParseError.extra(new Token('stuff', 1, 41, 45)), lineNo: 1, start: 41, end: 45}
					],
				},
			],
		},

		"given i love Asche and so and output into 'foo'": {
			givenThen: 'given',
			errors: [{message: ParseError.wrong(new Token('i', 1, 6, 6), 'I'), lineNo: 1, start: 6, end: 6}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 19, 21)), lineNo: 1, start: 19, end: 21},
						{message: ParseError.extra(new Token('so', 1, 23, 24)), lineNo: 1, start: 23, end: 24}
					],
					into: 'foo',
				},
			],
		},
		"Then i a b c and d and output into 'bar'": {
			givenThen: 'then',
			errors: [{message: ParseError.wrong(new Token('i', 1, 5, 5), 'I'), lineNo: 1, start: 5, end: 5}],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 13, 15)), lineNo: 1, start: 13, end: 15},
						{message: ParseError.extra(new Token('d', 1, 17, 17)), lineNo: 1, start: 17, end: 17}
					],
					into: 'bar',
				},
			],
		},
		"Then I domates biber patlican patates and output into 'baz'": {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [{message: ParseError.extra(new Token('patates', 1, 30, 36)), lineNo: 1, start: 30, end: 36}],
					into: 'baz',
				},
			],
		},
		"Given I open 'xfiles' and write file and stuff and output into 'quz'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [
						{message: ParseError.extra(new Token('and', 1, 37, 39)), lineNo: 1, start: 37, end: 39},
						{message: ParseError.extra(new Token('stuff', 1, 41, 45)), lineNo: 1, start: 41, end: 45}
					],
					into: 'quz',
				},
			],
		},

		"given i love Asche and so output into 'foo'": {
			givenThen: 'given',
			errors: [{message: ParseError.wrong(new Token('i', 1, 6, 6), 'I'), lineNo: 1, start: 6, end: 6}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 19, 21)), lineNo: 1, start: 19, end: 21},
						{message: ParseError.wrong(new Token('so', 1, 23, 24), 'and'), lineNo: 1, start: 23, end: 24}
					],
				},
			],
		},
		"Then i a b c and d into 'bar'": {
			givenThen: 'then',
			errors: [{message: ParseError.wrong(new Token('i', 1, 5, 5), 'I'), lineNo: 1, start: 5, end: 5}],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('d', 1, 17, 17), 'output'), lineNo: 1, start: 17, end: 17}],
				},
			],
		},
		"Then I domates biber patlican patates 'baz'": {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('patates', 1, 30, 36)), lineNo: 1, start: 30, end: 36},
						{message: ParseError.extra(new Token("'baz'", 1, 38, 42)), lineNo: 1, start: 38, end: 42}
					],
				},
			],
		},
		"Given I open 'xfiles' and write file and stuff and output 'quz'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [
						{message: ParseError.extra(new Token('and', 1, 37, 39)), lineNo: 1, start: 37, end: 39},
						{message: ParseError.wrong(new Token('stuff', 1, 41, 45), 'and'), lineNo: 1, start: 41, end: 45},
						{message: ParseError.wrong(new Token('and', 1, 47, 49), 'output'), lineNo: 1, start: 47, end: 49},
						{message: ParseError.wrong(new Token('output', 1, 51, 56), 'into'), lineNo: 1, start: 51, end: 56}
					],
				},
			],
		},

		"given i love Asche save output into 'foo'": {
			givenThen: 'given',
			errors: [{message: ParseError.wrong(new Token('i', 1, 6, 6), 'I'), lineNo: 1, start: 6, end: 6}],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [{message: ParseError.wrong(new Token('save', 1, 19, 22), 'and'), lineNo: 1, start: 19, end: 22}],
				},
			],
		},

		'Given I love Asche': {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [],
				},
			],
		},
		'Then I a b c': {
			givenThen: 'then',
			errors: [],
			matches: [{ key: { phrase: 'a b c' }, bindings: new Map(), err: [] }],
		},
		'Given I domates Biber patlIcan': {
			givenThen: 'given',
			errors: [],
			matches: [{ key: { phrase: 'domates biber patlican' }, bindings: new Map(), err: [] }],
		},
		"Given I open 'xfiles' and write file": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [],
				},
			],
		},
		"Then I connect to 'url' and send object 'myObj' and send http request": {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'connect',
						phrase: 'send http request',
						params: ['object'],
					},
					bindings: new Map([['object', 'myObj']]),
					connect: 'url',
					err: [],
				},
			],
		},

		"Given I love Asche and output into 'foo'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [],
					into: 'foo',
				},
			],
		},
		"Then I a b c and OUTPUT iNto 'bar'": {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [],
					into: 'bar',
				},
			],
		},
		"Given I domates Biber patlIcan AND OutPut inTo 'baz'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [],
					into: 'baz',
				},
			],
		},
		"Given I open 'xfiles' and write file and Output Into 'Quz'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'open',
						phrase: 'write file',
					},
					open: 'xfiles',
					bindings: new Map([]),
					err: [],
					into: 'Quz',
				},
			],
		},
		"Then I connect to 'url' and send object 'myObj' and send http request and output into 'result'":
			{
				givenThen: 'then',
				errors: [],
				matches: [
					{
						key: {
							openconnect: 'connect',
							phrase: 'send http request',
							params: ['object'],
						},
						bindings: new Map([['object', 'myObj']]),
						connect: 'url',
						err: [],
						into: 'result',
					},
				],
			},
		"Given I send bar 'bar_ident' and send foo 'foo_ident' and testing params order": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						params: ['foo', 'bar'],
						phrase: 'testing params order',
					},
					bindings: new Map([
						['bar', 'bar_ident'],
						['foo', 'foo_ident'],
					]),
					err: [],
				},
			],
		},
	}).forEach(([give, want], index) => {
		const lexed = lex(give, 1);
		if (!lexed.ok) throw new Error(lexed.error.message.message);
		const have = parse(p.store, ...(lexed.value));
		t.deepEqual(have, want, `${index}: ${give}`);
	});
});

