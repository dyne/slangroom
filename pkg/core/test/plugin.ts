import test from 'ava';
import { DuplicatePluginError, Plugin, type PluginExecutor } from '@slangroom/core';

test('Plugin.new() phrase alpha-numerical checks work', (t) => {
	[
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
	].forEach((x) => {
		const err = t.throws(() => new Plugin().new(x, (ctx) => ctx.pass(null)), {
			instanceOf: Error,
		}) as Error;
		t.is(
			err.message,
			'phrase must composed of alpha-numerical, underscore, and dash values split by a single space',
		);
	});

	['foo', 'foo bar', 'foo_bar', 'foo-bar', 'foo bar baz', 'foo_bar_baz', 'foo-bar-baz'].forEach(
		(x) => {
			t.notThrows(() => new Plugin().new(x, (ctx) => ctx.pass(null)));
		},
	);
});

test('Plugin.new() params alpha-numerical checks work', (t) => {
	[
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
		'punctuation!',
	].forEach((x) => {
		const err = t.throws(
			() => new Plugin().new([x], 'doesnt matter', (ctx) => ctx.pass(null)),
			{ instanceOf: Error },
		) as Error;
		t.is(
			err.message,
			'each params must composed of alpha-numerical values, optionally split by dashes or underscores',
		);
	});

	['foo', 'foo_bar', 'foo-bar', 'foo_bar_baz', 'foo-bar-baz'].forEach((x) => {
		t.notThrows(() => new Plugin().new(x, (ctx) => ctx.pass(null)));
	});
});

test('Plugin.new() duplicates detected', (t) => {
	const f: PluginExecutor = (ctx) => ctx.pass(null);
	t.is(
		(
			t.throws(
				() => {
					const p = new Plugin();
					p.new('a', f);
					p.new('a', f);
				},
				{ instanceOf: DuplicatePluginError },
			) as DuplicatePluginError
		).message,
		`duplicated plugin with key: openconnect= params= phrase="a"`,
	);

	t.is(
		(
			t.throws(
				() => {
					const p = new Plugin();
					p.new('a', f);
					p.new('open', 'a', f);
					p.new('open', 'a', f);
				},
				{ instanceOf: DuplicatePluginError },
			) as DuplicatePluginError
		).message,
		`duplicated plugin with key: openconnect=open params= phrase="a"`,
	);

	t.is(
		(
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
				{ instanceOf: DuplicatePluginError },
			) as DuplicatePluginError
		).message,
		`duplicated plugin with key: openconnect=connect params=foo phrase="a"`,
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
