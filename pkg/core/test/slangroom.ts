// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { DuplicatePluginError, Plugin, Slangroom } from '@slangroom/core';

test("doesn't allow duplicated plugins", (t) => {
	const p0 = new Plugin();
	p0.new('love asche', (ctx) => ctx.pass(null));
	const p1 = new Plugin();
	p1.new('love asche', (ctx) => ctx.pass(null));
	t.is(
		(
			t.throws(() => new Slangroom(p0, p1), {
				instanceOf: DuplicatePluginError,
			}) as DuplicatePluginError
		).message,
		`duplicated plugin with key: openconnect= params= phrase="love asche"`,
	);
});

test('runs all unknown statements', async (t) => {
	let usedP0 = false;
	let usedP1 = false;
	let usedP2 = false;
	let usedP3 = false;
	let usedP4 = false;

	const p0 = new Plugin();
	p0.new('a', (ctx) => {
		usedP0 = true;
		return ctx.pass('foo');
	});

	const p1 = new Plugin();
	p1.new(['a'], 'b', (ctx) => {
		usedP1 = true;
		t.is(ctx.fetch('a'), 'foo');
		return ctx.pass('bar');
	});

	const p2 = new Plugin();
	p2.new(['a'], 'c d', (ctx) => {
		usedP2 = true;
		t.is(ctx.fetch('a'), 'bar');
		return ctx.pass('foobar');
	});

	const p3 = new Plugin();
	p3.new('open', 'e f', (ctx) => {
		usedP3 = true;
		t.is(ctx.fetchOpen()[0], 'bar');
		return ctx.pass(null);
	});

	const p4 = new Plugin();
	p4.new('connect', 'f g', (ctx) => {
		usedP4 = true;
		t.is(ctx.fetchConnect()[0], 'foo');
		return ctx.pass(null);
	});

	const script = `
Rule unknown ignore
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
