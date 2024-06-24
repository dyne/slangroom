// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { fs } from '@slangroom/fs';
// read the version from the package.json
import packageJson from '@slangroom/fs/package.json' with { type: 'json' };

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const READ = `Rule unknown ignore
Given I send path 'filename' and read verbatim file content and output into 'content'
Given I have a 'string' named 'filename'
Given I have a 'string' named 'content'
Then print data
`


test.serial('unset FILES_DIR', async (t) => {
    const slangroom = new Slangroom(fs);
    const fn = slangroom.execute(READ, {
        data: {
            filename: "test.txt"
        },
    });
    const error = await t.throwsAsync(fn);
    t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send path 'filename' and read verbatim file content and output into 'content'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'filename'
3 | Given I have a 'string' named 'content'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/fs@${packageJson.version} Error: $FILES_DIR must be provided

Heap:
{
    "data": {
        "filename": "test.txt"
    },
    "keys": {}
}
`);
});

test.serial('File not found', async (t) => {
    process.env['FILES_DIR'] = ".";
    const slangroom = new Slangroom(fs);
    const fn = slangroom.execute(READ, {
        data: {
            filename: "test.txt"
        },
    });
    const error = await t.throwsAsync(fn);
    t.is(stripAnsiCodes((error as Error).message), `0 | Rule unknown ignore
1 | Given I send path 'filename' and read verbatim file content and output into 'content'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'filename'
3 | Given I have a 'string' named 'content'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/fs@${packageJson.version} Error: ENOENT: no such file or directory, open 'test.txt'

Heap:
{
    "data": {
        "filename": "test.txt"
    },
    "keys": {}
}
`);
});

test.serial('Read verbatim file', async (t) => {
    process.env['FILES_DIR'] = "./test";
    const slangroom = new Slangroom(fs);
    const fn = slangroom.execute(READ, {
        data: {
            filename: "test.txt"
        },
    });
    const result = await fn;
    t.deepEqual(result.result, {
        content:"Hello World!\n",
        filename: "test.txt"
    });
});

test.serial('path not a string', async (t) => {
	process.env['FILES_DIR'] = "./test";
	const slangroom = new Slangroom(fs);
	const fn = slangroom.execute(READ, {
		data: {
			filename: {
				"path": "test.txt"
			}
		},
	});
	const error = await t.throwsAsync(fn);
	t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send path 'filename' and read verbatim file content and output into 'content'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'filename'
3 | Given I have a 'string' named 'content'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/fs@${packageJson.version} Error: path must be string

Heap:
{
    "data": {
        "filename": {
            "path": "test.txt"
        }
    },
    "keys": {}
}
`);
});

test.serial('File exists', async (t) => {
	const verifyExists = `Rule unknown ignore
Given I send path 'filename' and verify file exists
Given I have a 'string' named 'filename'
Then print the 'filename'
Then print the string 'the file exists'
`
	process.env['FILES_DIR'] = "./test";
	const slangroom = new Slangroom(fs);
	const resultExists = slangroom.execute(verifyExists, {
		data: {
			filename: "test.txt"
		},
	});
	const res = await resultExists;
	t.deepEqual(res.result, {
		filename: 'test.txt',
		output: ["the_file_exists"]
	});
	const resultNotExists = slangroom.execute(verifyExists, {
		data: {
			filename: "test_not_exist.txt"
		},
	});
	const error = await t.throwsAsync(resultNotExists);
	t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send path 'filename' and verify file exists
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'filename'
3 | Then print the 'filename'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/fs@${packageJson.version} Error: no such file or directory: test/test_not_exist.txt

Heap:
{
    "data": {
        "filename": "test_not_exist.txt"
    },
    "keys": {}
}
`);
});

test.serial('File does not exist', async (t) => {
	const verifyDoesNotExists = `Rule unknown ignore
Given I send path 'filename' and verify file does not exist
Given I have a 'string' named 'filename'
Then print the 'filename'
Then print the string 'the file does not exist'
`
	process.env['FILES_DIR'] = "./test";
	const slangroom = new Slangroom(fs);
	const resultExists = slangroom.execute(verifyDoesNotExists, {
		data: {
			filename: "test.txt"
		},
	});
	const error = await t.throwsAsync(resultExists);
	t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send path 'filename' and verify file does not exist
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'filename'
3 | Then print the 'filename'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/fs@${packageJson.version} Error: file or directory found under: test/test.txt

Heap:
{
    "data": {
        "filename": "test.txt"
    },
    "keys": {}
}
`);
	const resultNotExists = slangroom.execute(verifyDoesNotExists, {
		data: {
			filename: "test_not_exist.txt"
		},
	});
	const res = await await resultNotExists;
	t.deepEqual(res.result, {
		filename: 'test_not_exist.txt',
		output: ["the_file_does_not_exist"]
	});
});
