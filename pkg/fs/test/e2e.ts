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