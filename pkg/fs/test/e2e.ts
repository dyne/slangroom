// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { fs } from '@slangroom/fs';

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
    t.is((error as Error).message, "$FILES_DIR must be provided");
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
    t.is((error as Error).message, 'ENOENT: no such file or directory, open \'test.txt\'');
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
	t.is((error as Error).message, 'path must be string');
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
	t.is((error as Error).message, 'no such file or directory: test/test_not_exist.txt');
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
	t.is((error as Error).message, 'file or directory found under: test/test.txt');
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
