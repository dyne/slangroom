import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { timestamp } from '@slangroom/timestamp';

test('fetch timestamp in seconds', async (t) => {
	const contract = `Rule unknown ignore
Given I fetch the local timestamp in seconds and output into 'output'
Given I have a 'string' named 'output'
Then print data
`
    const sl = new Slangroom(timestamp);
	const res = await sl.execute(contract);
	const ts = new Date().getTime() / 1000;
	t.true(Math.abs(Number(res) - ts) < 100);
});

test('fetch timestamp in milliseconds', async (t) => {
	const contract = `Rule unknown ignore
Given I fetch the local timestamp in seconds and output into 'output'
Given I have a 'string' named 'output'
Then print data
`
    const sl = new Slangroom(timestamp);
	const res = await sl.execute(contract);
	const ts = new Date().getTime();
	t.true(Math.abs(Number(res) - ts) < 100);
});
