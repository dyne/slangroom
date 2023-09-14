import test from 'ava';
import { allPlugins, SandboxDir } from '@slangroom/fs/plugins';
import { Slangroom } from '@slangroom/core';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

test('requires a real path', async (t) => {
	const slang = new Slangroom(allPlugins);
	const contract = `Rule unknown ignore
Given I have a 'string' named 'nameOfTheFile'

When I create the random object of '64' bits
When I rename the 'random_object' to 'stringToWrite'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
Then I print the 'stringToWrite'
Then I print the 'nameOfTheFile'
`;
	{
		const params = { data: { nameOfTheFile: '../trying/to/h4ck' } };
		const zout = await slang.execute(contract, params);
		const nameOfTheFile = zout.result['nameOfTheFile'] as string;
		await t.throwsAsync(fs.readFile(path.resolve(SandboxDir, nameOfTheFile)));
	}

	{
		const params = { data: { nameOfTheFile: '/trying/to/h4ck' } };
		const zout = await slang.execute(contract, params);
		const nameOfTheFile = zout.result['nameOfTheFile'] as string;
		await t.throwsAsync(fs.readFile(path.resolve(SandboxDir, nameOfTheFile)));
	}
});

test('keyholder works', async (t) => {
	const slang = new Slangroom(allPlugins);
	const contract = `Rule unknown ignore
Given I have a 'string' named 'nameOfTheFile'

When I create the random object of '64' bits
When I rename the 'random_object' to 'stringToWrite'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
Then I print the 'stringToWrite'
Then I print the 'nameOfTheFile'
`;
	const randomStr = (Math.random() + 1).toString(36).substring(7);
	const params = { data: { nameOfTheFile: randomStr } };
	const zout = await slang.execute(contract, params);
	const nameOfTheFile = zout.result['nameOfTheFile'] as string;
	const stringToWrite = zout.result['stringToWrite'] as string;
	const buf = await fs.readFile(path.resolve(SandboxDir, nameOfTheFile));
	t.is(buf.toString(), stringToWrite);
});
