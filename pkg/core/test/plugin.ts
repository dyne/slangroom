// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { DuplicatePluginError, Plugin, isSane, PluginContextTest, type PluginExecutor } from '@slangroom/core';

const insanes = [
	'',
	' ',
	'	',
	'\n',
	'NoN Lower cAse',
	'double  spacing',
	'tabs	in between',
	'new\nlines',
	' leading spaces',
	'trailing spaces ',
	' leading and trailing spaces ',
	'	leading tabs',
	'trailing tabs	',
	'	leading and trailing tabs	',
	"some 'identifiers' in between",
	'not- good',
	'not -bad',
	'not-good-',
	'not-bad-',
	'not_ good',
	'not _bad',
	'not_good_',
	'not_bad_',
];

test('isSane() works', (t) => {
	insanes.forEach((x) => t.false(isSane(x)));
});

test('Plugin.new() phrase alpha-numerical checks work', (t) => {
	insanes.forEach((x) =>
		t.throws(() => new Plugin().new(x, (ctx) => ctx.pass(null)), {
			instanceOf: Error,
			message:
				'phrase must be composed of alpha-numerical, underscore, and dash values split by a single space',
		}),
	);

	[
		'foo',
		'foo bar',
		'foo_bar',
		'foo-bar',
		'foo bar baz',
		'foo_bar_baz',
		'foo-bar-baz',
		'p-p',
		'p-256',
	].forEach((x) => t.notThrows(() => new Plugin().new(x, (ctx) => ctx.pass(null)), x));
});

test('Plugin.new() params alpha-numerical checks work', (t) => {
	insanes.forEach((x) =>
		t.throws(
			() => new Plugin().new([x], 'doesnt matter', (ctx) => ctx.pass(null)),
			{
				instanceOf: Error,
				message: `the following parameter must be composed of alpha-numerical values, optionally split by dashes or underscores: ${x}`,
			},
			x,
		),
	);

	['foo', 'foo_bar', 'foo-bar', 'foo_bar_baz', 'foo-bar-baz', 'p-p', 'p-256'].forEach((x) => {
		t.notThrows(() => new Plugin().new(x, (ctx) => ctx.pass(null)), x);
	});
});

test('Plugin.new() duplicates detected', (t) => {
	const f: PluginExecutor = (ctx) => ctx.pass(null);
	t.throws(
		() => {
			const p = new Plugin();
			p.new('a', f);
			p.new('a', f);
		},
		{
			instanceOf: DuplicatePluginError,
			message: `duplicated plugin with key: openconnect= params= phrase="a"`,
		},
	);

	t.throws(
		() => {
			const p = new Plugin();
			p.new('a', f);
			p.new('open', 'a', f);
			p.new('open', 'a', f);
		},
		{
			instanceOf: DuplicatePluginError,
			message: `duplicated plugin with key: openconnect=open params= phrase="a"`,
		},
	);

	t.throws(
		() => {
			const p = new Plugin();
			p.new('a', f);
			p.new('open', 'a', f);
			p.new('connect', 'a', f);
			p.new('open', ['foo'], 'a', f);
			p.new('connect', ['foo'], 'a', f);
			p.new('connect', ['foo'], 'a', f);
		},
		{
			instanceOf: DuplicatePluginError,
			message: `duplicated plugin with key: openconnect=connect params=foo phrase="a"`,
		},
	);
});

test('Plugin.new() clauses work', (t) => {
	const f: PluginExecutor = (ctx) => ctx.pass(null);
	{
		const p = new Plugin();
		p.new('love asche', f);
		t.true(p.store.has({ phrase: 'love asche' }));
	}

	{
		const p = new Plugin();
		p.new('open', 'love asche', f);
		t.true(p.store.has({ openconnect: 'open', phrase: 'love asche' }));
	}

	{
		const p = new Plugin();
		p.new('connect', 'love asche', f);
		t.true(p.store.has({ openconnect: 'connect', phrase: 'love asche' }));
	}

	{
		const p = new Plugin();
		p.new(['howmuch'], 'love asche', f);
		t.true(p.store.has({ params: ['howmuch'], phrase: 'love asche' }));
	}

	{
		const p = new Plugin();
		p.new('open', ['howmuch'], 'love asche', f);
		t.true(p.store.has({ openconnect: 'open', params: ['howmuch'], phrase: 'love asche' }));
	}

	{
		const p = new Plugin();
		p.new('connect', ['howmuch'], 'love asche', f);
		t.true(p.store.has({ openconnect: 'connect', params: ['howmuch'], phrase: 'love asche' }));
	}
});

test('PluginContext', async (t) => {
	const p = new Plugin();
	// ctxs
	const emptyCtx = new PluginContextTest([], {});
	const connectOpenCtx = new PluginContextTest('some_path', {});
	const objCtx = new PluginContextTest('', {obj: 'obj'});
	// pass and fail
	const pass = p.new('test pass', (ctx) => ctx.pass('done'));
	const fail = p.new('test fail', (ctx) => ctx.fail(new Error ('failed')));
	t.deepEqual(await pass(emptyCtx), { ok: true, value: 'done' });
	t.deepEqual(await fail(emptyCtx), { ok: false, error: new Error('failed') });
	// connect
	const getConnect = p.new('connect', 'test get connect', (ctx) => ctx.pass(ctx.getConnect()));
	const fetchConnect = p.new('connect', 'test fetch connect', (ctx) => ctx.pass(ctx.fetchConnect()));
	t.deepEqual(await getConnect(connectOpenCtx), { ok: true, value: ['some_path']});
	t.deepEqual(await fetchConnect(connectOpenCtx), { ok: true, value: ['some_path']});
	t.deepEqual(await getConnect(emptyCtx), { ok: true, value: []});
	const fetchConnectErr = await t.throwsAsync(async() => await fetchConnect(emptyCtx));
	t.is(fetchConnectErr.message, 'a connect is required');
	// open
	const getOpen = p.new('open', 'test get open', (ctx) => ctx.pass(ctx.getOpen()));
	const fetchOpen = p.new('open', 'test fetch open', (ctx) => ctx.pass(ctx.fetchOpen()));
	t.deepEqual(await getOpen(connectOpenCtx), { ok: true, value: ['some_path']});
	t.deepEqual(await fetchOpen(connectOpenCtx), { ok: true, value: ['some_path']});
	t.deepEqual(await getOpen(emptyCtx), { ok: true, value: []});
	const fetchOpenErr = await t.throwsAsync(async() => await fetchOpen(emptyCtx));
	t.is(fetchOpenErr.message, 'a open is required');
	// get and fetch
	const get = p.new(['obj'],'test get', (ctx) => ctx.pass(ctx.get('obj') || null));
	const fetch = p.new(['obj'], 'test fetch', (ctx) => ctx.pass(ctx.fetch('obj') || null));
	t.deepEqual(await get(objCtx), { ok: true, value: 'obj' });
	t.deepEqual(await fetch(objCtx), { ok: true, value: 'obj' });
	t.deepEqual(await get(emptyCtx), { ok: true, value: null });
	const err = await t.throwsAsync(async() => await fetch(emptyCtx));
	t.is(err.message, 'the parameter isn\'t provided: obj');
});
