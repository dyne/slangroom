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
			errors: [ParseError.missing('given', 'then'), ParseError.missing('I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.missing('love'), ParseError.missing('asche')],
				},
			],
		},

		G: {
			errors: [
				ParseError.wrong(new Token('G', 0, 0), 'given', 'then'),
				ParseError.missing('I'),
			],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.missing('love'), ParseError.missing('asche')],
				},
			],
		},
		t: {
			errors: [
				ParseError.wrong(new Token('t', 0, 0), 'given', 'then'),
				ParseError.missing('I'),
			],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.missing('love'), ParseError.missing('asche')],
				},
			],
		},

		'given Me': {
			givenThen: 'given',
			errors: [ParseError.wrong(new Token('Me', 6, 7), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.missing('love'), ParseError.missing('asche')],
				},
			],
		},
		'Then myself': {
			givenThen: 'then',
			errors: [ParseError.wrong(new Token('myself', 5, 10), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.missing('love'), ParseError.missing('asche')],
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
					err: [ParseError.wrong(new Token('notAsche', 13, 20), 'asche')],
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
					err: [ParseError.wrong(new Token('foobar', 11, 16), 'c')],
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
						ParseError.wrong(new Token('patates', 16, 22), 'biber'),
						ParseError.wrong(new Token('biber', 24, 28), 'patlican'),
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
					err: [ParseError.wrong(new Token('files', 32, 36), 'file')],
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
					err: [ParseError.wrong(new Token('Like', 7, 10), 'love')],
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
					err: [ParseError.wrong(new Token('biber', 10, 14), 'b')],
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
						ParseError.wrong(new Token('domates', 7, 13), 'a'),
						ParseError.wrong(new Token('patates', 17, 23), 'c'),
					],
				},
				{
					key: { phrase: 'domates biber patlican' },
					bindings: new Map(),
					err: [
						ParseError.wrong(new Token('b', 15, 15), 'biber'),
						ParseError.wrong(new Token('patates', 17, 23), 'patlican'),
					],
				},
			],
		},

		'given i love Asche and so': {
			givenThen: 'given',
			errors: [ParseError.wrong(new Token('i', 6, 6), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						ParseError.extra(new Token('and', 19, 21)),
						ParseError.extra(new Token('so', 23, 24)),
					],
				},
			],
		},
		'Then i a b c and d': {
			givenThen: 'then',
			errors: [ParseError.wrong(new Token('i', 5, 5), 'I')],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [
						ParseError.extra(new Token('and', 13, 15)),
						ParseError.extra(new Token('d', 17, 17)),
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
					err: [ParseError.extra(new Token('patates', 30, 36))],
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
						ParseError.extra(new Token('and', 37, 39)),
						ParseError.extra(new Token('stuff', 41, 45)),
					],
				},
			],
		},

		"given i love Asche and so and output into 'foo'": {
			givenThen: 'given',
			errors: [ParseError.wrong(new Token('i', 6, 6), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						ParseError.extra(new Token('and', 19, 21)),
						ParseError.extra(new Token('so', 23, 24)),
					],
					into: 'foo',
				},
			],
		},
		"Then i a b c and d and output into 'bar'": {
			givenThen: 'then',
			errors: [ParseError.wrong(new Token('i', 5, 5), 'I')],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [
						ParseError.extra(new Token('and', 13, 15)),
						ParseError.extra(new Token('d', 17, 17)),
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
					err: [ParseError.extra(new Token('patates', 30, 36))],
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
						ParseError.extra(new Token('and', 37, 39)),
						ParseError.extra(new Token('stuff', 41, 45)),
					],
					into: 'quz',
				},
			],
		},

		"given i love Asche and so output into 'foo'": {
			givenThen: 'given',
			errors: [ParseError.wrong(new Token('i', 6, 6), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [
						ParseError.extra(new Token('and', 19, 21)),
						ParseError.wrong(new Token('so', 23, 24), 'and'),
					],
				},
			],
		},
		"Then i a b c and d into 'bar'": {
			givenThen: 'then',
			errors: [ParseError.wrong(new Token('i', 5, 5), 'I')],
			matches: [
				{
					key: { phrase: 'a b c' },
					bindings: new Map(),
					err: [ParseError.wrong(new Token('d', 17, 17), 'output')],
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
						ParseError.extra(new Token('patates', 30, 36)),
						ParseError.extra(new Token("'baz'", 38, 42)),
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
						ParseError.extra(new Token('and', 37, 39)),
						ParseError.wrong(new Token('stuff', 41, 45), 'and'),
						ParseError.wrong(new Token('and', 47, 49), 'output'),
						ParseError.wrong(new Token('output', 51, 56), 'into'),
					],
				},
			],
		},

		"given i love Asche save output into 'foo'": {
			givenThen: 'given',
			errors: [ParseError.wrong(new Token('i', 6, 6), 'I')],
			matches: [
				{
					key: { phrase: 'love asche' },
					bindings: new Map(),
					err: [ParseError.wrong(new Token('save', 19, 22), 'and')],
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
		"Given I send bar 'ident' and send foo 'ident' and testing params order": {
			givenThen: 'given',
			errors: [],
			matches: [
				{
					key: {
						params: ['foo', 'bar'],
						phrase: 'testing params order',
					},
					bindings: new Map([
						['bar', 'ident'],
						['foo', 'ident'],
					]),
					err: [],
				},
			],
		},
	}).forEach(([give, want], index) => {
		const have = parse(p.store, lex(give));
		t.deepEqual(have, want, `${index}: ${give}`);
	});
});
