import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🎣 get path object', async (t) => {
    const setter = `Rule unknown ignore
Given I send object 'the_object' and send path 'the_path' and manipulate and get and output into 'mimmo'
Given I have a 'string' named 'mimmo'

Then print 'mimmo'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(setter, {
        data: {
            "the_object": {
                "a": "b",
				"c": {
					"d": "e"
				}
            },
            "the_path": "c.d"
        },
    });
    t.deepEqual(res.result, {
        mimmo: 'e'
    }, res.logs)
});
