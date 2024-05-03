// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import nock from 'nock';
import { Slangroom } from '@slangroom/core';
import { http } from '@slangroom/http';

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

nock('http://localhost')
	.get('/greeting-es')
	.reply(200, { req: 'Hola chico!' })
	.get('/greeting-en')
	.reply(200, { req: 'Hi!' })
	.post('/sendresult')
	.reply((_, body: any) => {
		const req = body['req'];
		if (req?.includes('Hola') || req?.includes('Hi')) return [200, 'received result'];
		return [500, 'Did not receive the result'];
	})
	.get('/auth-required')
	.matchHeader('authorization', 'Basic Auth test')
	.reply(200, 'Yes, you can!')
	.persist();

test('Full script that uses http plugin', async (t) => {
	const script = `
Rule unknown ignore
Given I connect to 'greeting_es' and do get and output into 'es'
Given I connect to 'greeting_en' and do get and output into 'en'

Given I have a 'string dictionary' named 'result' in 'es'
Given I rename 'result' to 'result es'
Given I have a 'string dictionary' named 'result' in 'en'
Given I rename 'result' to 'result en'


Given I have a 'string array' named 'final endpoints'
When I create the 'string array'
When I move 'result_es' in 'string array'
When I move 'result_en' in 'string array'
Then print data
Then I connect to 'final_endpoints' and send object 'string_array' and do parallel post and output into 'results'
`;
	const slangroom = new Slangroom(http);
	const res = await slangroom.execute(script, {
		data: {
			greeting_es: 'http://localhost/greeting-es',
			greeting_en: 'http://localhost/greeting-en',
			final_endpoints: ['http://localhost/sendresult', 'http://localhost/sendresult'],
		},
	});
	t.deepEqual(
		res.result,
		{
			final_endpoints: ['http://localhost/sendresult', 'http://localhost/sendresult'],
			string_array: [{ req: 'Hola chico!' }, { req: 'Hi!' }],
			results: [
				{ status: '200', result: 'received result' },
				{ status: '200', result: 'received result' },
			],
		},
		res.logs,
	);
});

test('Send auth header', async (t) => {
	const script = `
Rule unknown ignore
Given I connect to 'auth_url' and send headers 'headers' and do get and output into 'auth'

Given I have a 'string dictionary' named 'auth'

Then print data
`;
	const slangroom = new Slangroom(http);
	const res = await slangroom.execute(script, {
		data: {
			auth_url: 'http://localhost/auth-required',
			headers: {
				authorization: 'Basic Auth test',
			},
		},
	});
	t.deepEqual(
		res.result,
		{
			auth: {
				result: 'Yes, you can!',
				status: '200',
			},
		},
		res.logs,
	);
});

test('sequential not yet implemented', async (t) => {
	const script = `
Rule unknown ignore
Given I connect to 'greeting_es' and do sequential get and output into 'res'
Given I have a 'string' named 'greeting_es'
Then print data
`;
	const slangroom = new Slangroom(http);
	const fn = slangroom.execute(script, {
		data: {
			greeting_es: 'http://localhost/greeting-es'
		},
	});
	const error = await t.throwsAsync(fn);
	t.is(stripAnsiCodes((error as Error).message),
`1 | Rule unknown ignore
2 | Given I connect to 'greeting_es' and do sequential get and output into 'res'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
3 | Given I have a 'string' named 'greeting_es'
4 | Then print data
Slangroom @slangroom/http Error: sequential requests are not implemented
`);
});
