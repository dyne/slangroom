
import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🔇 compact arrays ', async (t) => {
    const picked = `Rule unknown ignore
Given I have a 'string array' named 'the_array'

Then print data
Then I send array 'the_array' and manipulate and compact and output into 'mimmo'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            "the_array": ["c", "d", ''],
            "mimmo": ["a"]
        },
    });
    t.deepEqual(res.result, {
        the_array: [
            "c",
            "d",
        ],
        mimmo: [
            "c",
            "d",
        ]
    }, res.logs)
});
