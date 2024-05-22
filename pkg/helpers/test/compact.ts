// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🔇 set path object', async (t) => {
    const setter = `Rule unknown ignore
Given I send object 'the_object' and send path 'the_path' and send value 'the_value' and manipulate and set and output into 'mimmo'
Given I have a 'string dictionary' named 'the_object'
Given I have a 'string dictionary' named 'mimmo'

Then print 'mimmo'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(setter, {
        data: {
            "the_object": {
                "a": "b"
            },
            "the_path": "attribute",
            "the_value": { "name": "mimmo" },
        },
    });
    t.deepEqual(res.result, {
        mimmo: {
            a: 'b',
            attribute: {
                name: 'mimmo',
            },
        },
    }, res.logs)
});

test('@slangroom/helpers 🔇 compact arrays ', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and manipulate and compact and output into 'mimmo'
Given I have a 'string array' named 'the_array'
Given I have a 'string array' named 'mimmo'

Then print 'mimmo'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "the_array": [0, "c", false, "d", '', "😆"]
        },
    });
    t.deepEqual(res.result, {
        mimmo: [
            "c",
            "d",
            "😆",
        ]
    }, res.logs)
});
