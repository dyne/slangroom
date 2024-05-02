// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

const expected = {
    r: {
        a: 'b',
        c: {
            d: {
                e: '42',
            },
        },
    },
}

test('@slangroom/helpers 😆  pick object', async (t) => {
    const picked = `Rule unknown ignore
Given I send object 'complex_object' and send properties 'props' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            props: ["a", "c.d"],
            complex_object: {
                "a": "b",
                "c": {
                    "d": {
                        "e": 42
                    },
                    "f": "g"
                }
            }
        },
    });
    t.deepEqual(res.result, expected, res.logs)
});

test('@slangroom/helpers 😆  pick object with params not in order', async (t) => {
    const picked = `Rule unknown ignore
Given I send properties 'props' and send object 'complex_object' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            props: ["a", "c.d"],
            complex_object: {
                "a": "b",
                "c": {
                    "d": {
                        "e": 42
                    },
                    "f": "g"
                }
            }
        },
    });
    t.deepEqual(res.result, expected, res.logs)
});


test('@slangroom/helpers 😆  pick object with one string params ', async (t) => {
    const picked = `Rule unknown ignore
Given I send properties 'props' and send object 'complex_object' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            props: "a",
            complex_object: {
                "a": "b",
                "c": {
                    "d": {
                        "e": 42
                    },
                    "f": "g"
                }
            }
        },
    });
    t.deepEqual(res.result, { r: { a: 'b' } }, res.logs)
});

test('@slangroom/helpers 😆  pick object with one string as an array of one element', async (t) => {
    const picked = `Rule unknown ignore
Given I send properties 'props' and send object 'complex_object' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            props: ["a"],
            complex_object: {
                "a": "b",
                "c": {
                    "d": {
                        "e": 42
                    },
                    "f": "g"
                }
            }
        },
    });
    t.deepEqual(res.result, { r: { a: 'b' } }, res.logs)
});
test('@slangroom/helpers 😆  pick handle fuzzy input', async (t) => {
    const picked = `Rule unknown ignore
Given I send properties 'props' and send object 'complex_object' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'
`;

    const slangroom = new Slangroom(helpers);
    const res = await slangroom.execute(picked, {
        data: {
            props: ["a", "c.d", "random", 123, null, {}],
            complex_object: {
                "a": "b",
                "c": {
                    "d": {
                        "e": 42
                    },
                    "f": "g"
                },
                "random": "value",
                "123": 123,
                "null": null,
                "object": {}
            }
        },
    });
    const reuslt = { ...expected.r, random: "value", 123: "123" }
    t.deepEqual(res.result, { r: reuslt }, res.logs);
});

test('@slangroom/helpers 😆  pick breaks when not found', async (t) => {
    const picked = `Rule unknown ignore
Given I send properties 'props' and send object 'complex_object' and manipulate and pick and output into 'r'
Given I have a 'string dictionary' named 'complex_object'
Given I have a 'string dictionary' named 'r'

Then print 'r'

`;

    const slangroom = new Slangroom(helpers);
    const fn = slangroom.execute(picked, {
        data: {
            props: "a", // wrong type
            complex_object: expected
        },
    });
    const error = await t.throwsAsync(fn);
    t.is((error as Error).message, `Slangroom @slangroom/helper Error: MANIPULATION ERRROR:
None of the properties

 "a"

 exist in the object:

 {
   "r": {
      "a": "b",
      "c": {
         "d": {
            "e": "42"
         }
      }
   }
}`);
});

