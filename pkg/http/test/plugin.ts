// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { PluginContextTest } from '@slangroom/core';
import { defaults, sames, parallels } from '@slangroom/http';
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
	const ctx = PluginContextTest.connect('http://localhost/normaljson');
	const res = await defaults.get(ctx);
	t.deepEqual(res, {
		ok: true,
		value: {
			status: '200',
			result: {
				userId: 1,
				myArray: [1, 2, 3, 4, 5],
				myStringArary: ['one', 'two', 'three'],
				myJson: {
					1: 'First property',
					2: 123,
				},
			},
			headers: {
				'content-type': 'application/json'
			}
		},
	});
});

test('single put with data', async (t) => {
	const ctx = new PluginContextTest('http://localhost/sendresultwithput', {
		object: { myData: 'foobar' },
	});
	const res = await defaults.putObject(ctx);
	t.deepEqual(res, {
		ok: true,
		value: { status: '200', result: 'received result', headers: {} },
	});
});

test('single post with data', async (t) => {
	const ctx = new PluginContextTest('http://localhost/sendresult', {
		object: { myData: 'foobar' },
	});
	const res = await defaults.postObject(ctx);
	t.deepEqual(res, {
		ok: true,
		value: { status: '200', result: 'received result', headers: {} },
	});
});

test('multiple post with data', async (t) => {
	const ctx = new PluginContextTest(
		['http://localhost/sendresult', 'http://localhost/normaljson'],
		{ object: { myData: 'foobar' } },
	);
	const res = await sames.postObject(ctx);
	t.deepEqual(res, {
		ok: true,
		value: [
			{ status: '200', result: 'received result', headers: {} },
			{ status: '404', result: "doesn't exist, mate", headers: {} },
		],
	});
});

test('POSTs with custom different', async (t) => {
	const ctx = new PluginContextTest(
		[
			'http://localhost/sendresult',
			'http://localhost/normaljson',
			'http://localhost/sendresult',
		],
		{ object: [{ myData: 'foobar' }, { myData: 'foobar' }, { mData: 'foobar' }] },
	);
	const res = await parallels.postObject(ctx);
	t.deepEqual(res, {
		ok: true,
		value: [
			{ status: '200', result: 'received result', headers: {} },
			{ status: '404', result: "doesn't exist, mate", headers: {} },
			{ status: '500', result: 'Did not receive the result', headers: {} },
		],
	});
});
