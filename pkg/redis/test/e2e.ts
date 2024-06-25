// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test, { registerCompletionHandler } from 'ava';
import { Slangroom } from '@slangroom/core';
import { redis } from '@slangroom/redis';
import process from 'node:process';
// read the version from the package.json
import packageJson from '@slangroom/redis/package.json' with { type: 'json' };

// https://github.com/avajs/ava/blob/main/docs/08-common-pitfalls.md#timeouts-because-a-file-failed-to-exit
registerCompletionHandler(() => {
	process.exit();
});

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('Redis write and read back', async (t) => {
	const obj = {
		name: 'test person',
		age: Math.floor(Math.random() * 100).toString(),
	};
	const writeRedis = `
Rule unknown ignore
Given I connect to 'redis' and send key 'key1' and send object 'object1' and write object into key in redis
Given I connect to 'redis' and send key 'key1' and read key from redis and output into 'read1'
Given I have a 'string dictionary' named 'read1'

Then print data
Then I connect to 'redis' and send key 'key1' and delete key from redis
Then I connect to 'redis' and send key 'key1' and read key from redis and output into 'read2'
`;
	const slangroom = new Slangroom(redis);
	const res = await slangroom.execute(writeRedis, {
		keys: {
			redis: 'redis://localhost:6379',
			object1: obj,
			key1: 'persona',
		},
	});
	t.deepEqual(res['result']['read1'], obj);
	t.deepEqual(res['result']['read2'], {});
});

test('Redis wrong url', async (t) => {
	const readRedis = `Rule unknown ignore
Given I connect to 'redis' and send key 'key' and read key from redis and output into 'read'
Given I have a 'string dictionary' named 'read'
Then print data
`;
	const slangroom = new Slangroom(redis);
	const fn = slangroom.execute(readRedis, {
		keys: {
			redis: 'redis://wrong_url:6379',
			key: 'some_random_key',
		},
	});
	const error = await t.throwsAsync(fn);
	t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I connect to 'redis' and send key 'key' and read key from redis and output into 'read'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string dictionary' named 'read'
3 | Then print data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/redis@${packageJson.version} Error: Connection timeout
`)
});

test('Redis read not set key', async (t) => {
	const readRedis = `Rule unknown ignore
Given I connect to 'redis' and send key 'key' and read key from redis and output into 'read'
Given I have a 'string dictionary' named 'read'
Then print data
`;
	const slangroom = new Slangroom(redis);
	const res = await slangroom.execute(readRedis, {
		keys: {
			redis: 'redis://localhost:6379',
			key: 'some_random_key',
		},
	});
	t.deepEqual(res['result']['read'], []);
});
