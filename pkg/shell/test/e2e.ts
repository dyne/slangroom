// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { shell } from '@slangroom/shell';
import { $ } from 'execa';

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('execute shell command `ls -a`', async (t) => {
    const { stdout } = await $`ls -a`
    const ls = `Rule unknown ignore
Given I send command 'c' and execute in shell and output into 'r'
Given I have a 'string' named 'r'

Then print data
`;

    const slangroom = new Slangroom(shell);
    const res = await slangroom.execute(ls, {
        data: {
            c: "ls -a"
        },
    });
    t.deepEqual(res.result['r'], stdout, res.logs)
});

test('expect error when command is not found', async (t) => {
    const ls = `Rule unknown ignore
Given I send command 'c' and execute in shell and output into 'r'
Given I have a 'string' named 'r'

Then print data
`;

    const slangroom = new Slangroom(shell);
    const fn = slangroom.execute(ls, {
        data: {
            c: "notfound -v"
        },
    });
    const error = await t.throwsAsync(fn);
    t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send command 'c' and execute in shell and output into 'r'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'r'
3 | 
Error: Slangroom @slangroom/shell Error: Command failed with ENOENT: notfound -v
spawn notfound ENOENT
`);
});

test('expect stderr and exit code when command fails', async (t) => {
    const failure = `Rule unknown ignore
Given I send command 'c' and execute in shell and output into 'r'
Given I have a 'string' named 'r'

Then print data
`;

    const slangroom = new Slangroom(shell);
    const fn = slangroom.execute(failure, {
        data: {
            c: "cat notfound.txt"
        },
    });
    const error = await t.throwsAsync(fn);
    t.is(stripAnsiCodes((error as Error).message),
`0 | Rule unknown ignore
1 | Given I send command 'c' and execute in shell and output into 'r'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string' named 'r'
3 | 
Error: Slangroom @slangroom/shell Error: Command failed with exit code 1: cat notfound.txt
cat: notfound.txt: No such file or directory
`);
});
