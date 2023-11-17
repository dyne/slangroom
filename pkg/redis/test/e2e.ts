import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { redis } from '@slangroom/redis';

test('Redis write and read back', async (t) => {
	const obj = {
		name: 'test person',
		age: Math.floor(Math.random() * 100),
	}
	const writeRedis = `
Rule unknown ignore
Given I connect to 'redis' and send key 'key1' and send object 'object1' and write to redis
Given I connect to 'redis' and send key 'key1' and read from redis and output into 'read1'
Given I have a 'string dictionary' named 'read1'

Then print data
Then I connect to 'redis' and send key 'key1' and delete from redis
Then I connect to 'redis' and send key 'key1' and read from redis and output into 'read2'
`;
	const slangroom = new Slangroom(redis);
	const res = await slangroom.execute(writeRedis, {
		keys: {
			redis: "redis://localhost:6379",
			object1: obj,
			key1: 'persona'
		},
	});
	t.deepEqual(obj, res["result"]["read1"]);
	t.deepEqual({}, res["result"]["read2"]);
});

