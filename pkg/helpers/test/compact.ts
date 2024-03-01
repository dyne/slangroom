
import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🔇 compact arrays ', async (t) => {
    const picked = `Rule unknown ignore
Given I send array 'the_array' and manipulate and compact and output into 'mimmo'
Given I have a 'string array' named 'the_array'
Given I have a 'string dictionary' named 'mimmo'

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