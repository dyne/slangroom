// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { git } from '@slangroom/git';
import { promises as fs } from '@zenfs/core';
// read the version from the package.json
import packageJson from '@slangroom/git/package.json' with { type: 'json' };

process.env['FILES_DIR'] = './test';

const stripAnsiCodes = (str: string) =>
	str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('Should fail to check non existing repository', async (t) => {
	const slangroom = new Slangroom(git);
	const data = {
		path: 'some/dumb/path',
		verified_git_repo: 'true',
	};
	const zen = `Rule unknown ignore
	Given I open 'path' and verify git repository
	Given I have a 'string' named 'verified_git_repo'
	Then print the data`;
	const fn = slangroom.execute(zen, {
		data,
	});
	const error = await t.throwsAsync(fn);
	t.is(
		stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 |     Given I open 'path' and verify git repository
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |     Given I have a 'string' named 'verified_git_repo'
3 |     Then print the data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/git@${packageJson.version} Error: Could not find git root for ..

Heap:
{
    "path": "some/dumb/path",
    "verified_git_repo": "true"
}
`,
	);
});

test('Should not clone a not exitsting repository', async (t) => {
	const slangroom = new Slangroom(git);
	const data = {
		url: 'https://github.com/matteo-cristino/dumb',
		path: 'another/dumb/path',
		cloned_repository: 'true',
	};
	const zen = `Rule unknown ignore
	Given I connect to 'url' and send path 'path' and clone repository
	Given I have a 'string' named 'cloned_repository'
	Then print the data`;

	const fn = slangroom.execute(zen, {
		data,
	});
	const error = await t.throwsAsync(fn);
	t.is(
		stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 |     Given I connect to 'url' and send path 'path' and clone repository
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |     Given I have a 'string' named 'cloned_repository'
3 |     Then print the data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/git@${packageJson.version} Error: HTTP Error: 401 Unauthorized

Heap:
{
    "url": "https://github.com/matteo-cristino/dumb",
    "path": "another/dumb/path",
    "cloned_repository": "true"
}
`,
	);
});

test.serial('Should clone a repository', async (t) => {
	const slangroom = new Slangroom(git);
	const data = {
		url: 'https://github.com/srfsh/dumb',
		path: 'dumb',
		cloned_repository: 'true',
	};
	const zen = `Rule unknown ignore
	Given I connect to 'url' and send path 'path' and clone repository
	Given I have a 'string' named 'cloned_repository'
	Then print the data`;

	const res = await slangroom.execute(zen, {
		data,
	});
	t.deepEqual(
		res.result,
		{
			cloned_repository: 'true',
		},
		res.logs,
	);
});

test.serial('Should verify git repository', async (t) => {
	const slangroom = new Slangroom(git);
	const data = {
		path: 'dumb',
		verified_git_repo: 'true',
	};
	const zen = `Rule unknown ignore
	Given I open 'path' and verify git repository
	Given I have a 'string' named 'verified_git_repo'
	Then print data`;
	const res = await slangroom.execute(zen, {
		data,
	});
	t.deepEqual(
		res.result,
		{
			verified_git_repo: 'true',
		},
		res.logs,
	);
});

test.serial('Should create a new git commit', async (t) => {
	const slangroom = new Slangroom(git);
	const data = {
		path: 'dumb',
		commit: {
			author: 'Jhon Doe',
			message: 'docs: update readme',
			email: 'jhon.doe@example.com',
			files: ['README.md'],
		},
	};
	const zen = `Rule unknown ignore
	Given I open 'path' and send commit 'commit' and create new git commit and output into 'commit_hash'
	Given I have a 'string' named 'commit hash'
	Then print data`;
	await fs.appendFile('./test/dumb/README.md', '\nChanged the README\n');
	const res = await slangroom.execute(zen, {
		data,
	});
	t.truthy(typeof res.result['commit_hash'] === 'string');
});

test.after.always('guaranteed cleanup', async () => {
	await fs.rm('./test/dumb', { recursive: true });
});
