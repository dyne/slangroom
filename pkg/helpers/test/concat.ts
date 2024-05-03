// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('@slangroom/helpers 🧲 concat arrays ', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and send values 'v' and manipulate and concat and output into 'r'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "v": ["a", "b", "😀"],
            "the_array": ["c", "d", "😆"]
        },
    });
    t.deepEqual(res.result, {
        r: [
            "c",
            "d",
            "😆",
            "a",
            "b",
            "😀"
        ]
    }, res.logs)
});

test('@slangroom/helpers 🧲 concat arrays with missing values', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and manipulate and concat and output into 'r'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const fn = slangroom.execute(picked, {
        data: {
            "the_array": ["c", "d", "😆"]
        },
    });
    const error = await t.throwsAsync(fn);
    t.is(stripAnsiCodes((error as Error).message),
	`0 | Rule unknown ignore
1 | Given I send array 'the_array' and manipulate and concat and output into 'r'
                                                      ^^^^^^
2 | Given I have a 'string array' named 'the_array'
3 | Given I have a 'string dictionary' named 'r'
ParseError: "concat" at 2:51-56 must be one of: "compact"
`);
});

test('@slangroom/helpers 🧲 concat empty array', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and send values 'v' and manipulate and concat and output into 'r'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "v": ["a", "b", "😀"],
            "the_array": []
        },
    });
    t.deepEqual(res.result, {
        r: ["a", "b", "😀"]
    }, res.logs)
});

test('@slangroom/helpers 🧲 concat empty values', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and send values 'v' and manipulate and concat and output into 'r'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "v": [],
            "the_array": ["c", "d", "😆"]
        },
    });
    t.deepEqual(res.result, {
        r: ["c", "d", "😆"]
    }, res.logs)
});

test('@slangroom/helpers 🧲 concat empty values and empty array', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and send values 'v' and manipulate and concat and output into 'r'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "v": [],
            "the_array": []
        },
    });
    t.deepEqual(res.result, {
        r: []
    }, res.logs)
});
