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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
				},
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [
						{message: ParseError.wrong(new Token('b', 1, 15, 15), 'biber'), lineNo: 1, start: 15, end: 15},
						{message: ParseError.wrong(new Token('patates', 1, 17, 23), 'patlican'), lineNo: 1, start: 17, end: 23}
					],
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1
				},
			],
		},
		'Then I a b c': {
			givenThen: 'then',
			errors: [],
			matches: [{ key: { phrase: 'a b c' }, bindings: new Map(), err: [],lineNo: 1 }],
		},
		'Given I domates Biber patlIcan': {
			givenThen: 'given',
			errors: [],
			matches: [{ key: { phrase: 'domates biber patlican' }, bindings: new Map(), err: [], lineNo: 1 }],
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
					lineNo: 1
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
					lineNo: 1
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
					lineNo: 1,
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
					lineNo: 1,
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
					lineNo: 1,
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
					lineNo: 1,
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
						lineNo: 1,
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
					lineNo: 1
				},
			],
		},
		"Then I connect to 'url' send object 'myObj' and send http request": {
			givenThen: 'then',
			errors: [],
			matches: [
				{
					key: {
						openconnect: 'connect',
						phrase: 'send http request',
						params: ['object'],
					},
					bindings: new Map(),
					connect: 'url',
					err: [
						{message: ParseError.wrong(new Token('send', 1, 24, 27), 'and'), lineNo: 1, start: 24, end: 27},
						{message: ParseError.wrong(new Token('object', 1, 29, 34), 'send'), lineNo: 1, start: 29, end: 34},
						{message: ParseError.wrong(new Token('\'myObj\'', 1, 36, 42), 'object'), lineNo: 1, start: 36, end: 42},
						{message: ParseError.wrong(new Token('and', 1, 44, 46), '\'<identifier>\''), lineNo: 1, start: 44, end: 46},
						{message: ParseError.wrong(new Token('send', 1, 48, 51), 'and'), lineNo: 1, start: 48, end: 51},
						{message: ParseError.wrong(new Token('http', 1, 53, 56), 'send'), lineNo: 1, start: 53, end: 56},
						{message: ParseError.wrong(new Token('request', 1, 58, 64), 'http'), lineNo: 1, start: 58, end: 64},
						{message: ParseError.missing(new Token('request', 1, 58, 64), 'request'), lineNo: 1}
					],
					lineNo: 1,
				},
			],
		},
		"Given I love asche and be crazy and output into wrong 'result'": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {phrase: 'love asche'},
					bindings: new Map(),
					err: [
						{message: ParseError.extra(new Token('and', 1, 19, 21)), lineNo: 1, start: 19, end: 21},
						{message: ParseError.extra(new Token('be', 1, 23, 24)), lineNo: 1, start: 23, end: 24},
						{message: ParseError.extra(new Token('crazy', 1, 26, 30)), lineNo: 1, start: 26, end: 30},
						{message: ParseError.extra(new Token('and', 1, 32, 34)), lineNo: 1, start: 32, end: 34},
						{message: ParseError.wrong(new Token('output', 1, 36, 41), 'and'), lineNo: 1, start: 36, end: 41},
						{message: ParseError.wrong(new Token('into', 1, 43, 46), 'output'), lineNo: 1, start: 43, end: 46},
						{message: ParseError.wrong(new Token('wrong', 1, 48, 52), 'into'), lineNo: 1, start: 48, end: 52},
					],
					lineNo: 1,
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

