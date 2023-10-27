import test from 'ava';
import { PluginContextTest } from '@slangroom/core';
import { astify, execute } from '@slangroom/http';
import nock from 'nock';

nock('http://localhost')
	.post('/normaljson')
	.reply(404, "doesn't exist, mate")
	.get('/normaljson')
	.reply(200, {
		userId: 1,
		myArray: [1, 2, 3, 4, 5],
		myStringArary: ['one', 'two', 'three'],
		myJson: {
			1: 'First property',
			2: 123,
			// "3": true
		},
	})
	.get('/booleanjson')
	.reply(200, {
		userId: 1,
		myJson: {
			1: 'First property',
			2: 123,
			3: true,
		},
	})
	.post('/sendresult')
	.reply((_, body: any) => {
		if (body['myData']) return [200, 'received result'];
		return [500, 'Did not receive the result'];
	})
	.put('/sendresultwithput')
	.reply((_, body: any) => {
		if (body['myData']) return [200, 'received result'];
		return [500, 'Did not receive the result'];
	})
	.persist();

test('Simple GET', async (t) => {
	const { ast } = astify('do get');
	if (!ast) {
		t.fail();
		return;
	}

	const ctx = PluginContextTest.connect('http://localhost/normaljson');
	const res = await execute(ctx, ast.kind, ast.method);
	t.deepEqual(res, {
		ok: true,
		value: {
			status: 200,
			result: {
				userId: 1,
				myArray: [1, 2, 3, 4, 5],
				myStringArary: ['one', 'two', 'three'],
				myJson: {
					1: 'First property',
					2: 123,
				},
			},
		},
	});
});

test('single post with data', async (t) => {
	const { ast } = astify('do post');
	if (!ast) {
		t.fail();
		return;
	}

	const ctx = new PluginContextTest('http://localhost/sendresult', {
		object: { myData: 'foobar' },
	});
	const res = await execute(ctx, ast.kind, ast.method);
	t.deepEqual(res, {
		ok: true,
		value: { status: 200, result: 'received result' },
	});
});

test('single put with data', async (t) => {
	const { ast } = astify('do put');
	if (!ast) {
		t.fail();
		return;
	}

	const ctx = new PluginContextTest('http://localhost/sendresultwithput', {
		object: { myData: 'foobar' },
	});
	const res = await execute(ctx, ast.kind, ast.method);
	t.deepEqual(res, {
		ok: true,
		value: { status: 200, result: 'received result' },
	});
});

test('multiple post with data', async (t) => {
	const { ast } = astify('do same post');
	if (!ast) {
		t.fail();
		return;
	}

	const ctx = new PluginContextTest(
		['http://localhost/sendresult', 'http://localhost/normaljson'],
		{
			object: { myData: 'foobar' },
		}
	);
	const res = await execute(ctx, ast.kind, ast.method);
	t.deepEqual(res, {
		ok: true,
		value: [
			{ status: 200, result: 'received result' },
			{ status: 404, result: "doesn't exist, mate" },
		],
	});
});

test('POSTs with custom different', async (t) => {
	const { ast } = astify('do parallel post');
	if (!ast) {
		t.fail();
		return;
	}

	const ctx = new PluginContextTest(
		[
			'http://localhost/sendresult',
			'http://localhost/normaljson',
			'http://localhost/sendresult',
		],
		{ object: [{ myData: 'foobar' }, { myData: 'foobar' }, { mData: 'foobar' }] }
	);
	const res = await execute(ctx, ast.kind, ast.method);
	t.deepEqual(res, {
		ok: true,
		value: [
			{ status: 200, result: 'received result' },
			{ status: 404, result: "doesn't exist, mate" },
			{ status: 500, result: 'Did not receive the result' },
		],
	});
});
