import test from 'ava';
import {
	Slangroom,
	Parser,
	type PluginContext,
	type PluginResult,
	type Plugin,
} from '@slangroom/core';

test('runs all unknown statements', async (t) => {
	let usedP0 = false;
	let usedP1 = false;
	let usedP2 = false;
	let usedP3 = false;
	let usedP4 = false;

	const p0: Plugin = {
		parser: function (this: Parser) {
			this.RULE('p0Phrase', () => {
				this.token('a');
				this.into();
			});
		},
		executor: (ctx: PluginContext): PluginResult => {
			if (ctx.phrase === 'a') {
				usedP0 = true;
				return ctx.pass('foo');
			}
			return ctx.fail('Unkown phrase');
		},
	};

	const p1: Plugin = {
		parser: function (this: Parser) {
			this.RULE('p1Phrase', () => {
				this.sendpass('a');
				this.token('b');
				this.into();
			});
		},
		executor: (ctx: PluginContext): PluginResult => {
			if (ctx.phrase === 'b') {
				usedP1 = true;
				t.is(ctx.fetch('a'), 'foo');
				return ctx.pass('bar');
			}
			return ctx.fail('Unknown phrase');
		},
	};

	const p2: Plugin = {
		parser: function (this: Parser) {
			this.RULE('p2Phrase', () => {
				this.sendpass('a');
				this.token('c');
				this.token('d');
				this.into();
			});
		},
		executor: (ctx: PluginContext): PluginResult => {
			if (ctx.phrase === 'c d') {
				usedP2 = true;
				t.is(ctx.fetch('a'), 'bar');
				return ctx.pass('foobar');
			}
			return ctx.fail('Unkown phrase');
		},
	};

	const p3: Plugin = {
		parser: function (this: Parser) {
			this.RULE('p3Phrase', () => {
				this.open();
				this.token('e');
				this.token('f');
			});
		},
		executor: (ctx) => {
			if (ctx.phrase === 'e f') {
				usedP3 = true;
				t.is(ctx.fetchOpen()[0], 'bar');
				return ctx.pass(null);
			}
			return ctx.fail('Unkown phrase');
		},
	};

	const p4: Plugin = {
		parser: function (this: Parser) {
			this.RULE('p4Phrase', () => {
				this.connect();
				this.token('f');
				this.token('g');
			});
		},
		executor: (ctx) => {
			if (ctx.phrase === 'f g') {
				usedP4 = true;
				t.is(ctx.fetchConnect()[0], 'foo');
				return ctx.pass(null);
			}
			return ctx.fail('Unkown phrase');
		},
	};

	const script = `
Rule caller restroom-mw
Given I A and output into 'a'

Given I have a 'string' named 'a'
Then print 'a'

Then I send a 'a' and B and output into 'b'
Then I send a 'b' and  C d and output into 'mimmo'
Then I open 'b' and e F
Then I connect to 'a' and F g
`;
	const slangroom = new Slangroom(p4, p1, [p0, p2], p3);
	const res = await slangroom.execute(script);
	t.true(usedP0);
	t.true(usedP1);
	t.true(usedP2);
	t.true(usedP3);
	t.true(usedP4);
	t.deepEqual(res.result, { a: 'foo', b: 'bar', mimmo: 'foobar' }, res.logs);
});
