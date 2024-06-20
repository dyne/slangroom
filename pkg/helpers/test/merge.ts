// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🤝 merge objects', async (t) => {
    const merger = `Rule unknown ignore
Given I send object 'the_object' and send sources 'the_sources' and manipulate and merge and output into 'mimmo'
Given I have a 'string dictionary' named 'the_object'
Given I have a 'string dictionary' named 'mimmo'

Then print 'mimmo'
`;
	const slangroom = new Slangroom(helpers);
	const res = await slangroom.execute(merger, {
		data: {
			"the_object": {
				"names": {
					"first": "Bella",
					"third": "Owen"
				},
				"surnames": {
					"first": "Allen",
					"second": "Briggs"
				}
			},
			"the_sources": [
				{
					"names": {
							"second": "Jhon"
						}
				},
				{
					"surnames": {
						"third": "Doe"
					}
				}
			]
		},
	});
	t.deepEqual(res.result, {
        mimmo: {
			names: {
				first: 'Bella',
				second: 'Jhon',
				third: 'Owen',
			},
			surnames: {
				first: 'Allen',
				second: 'Briggs',
				third: 'Doe',
			},
		},
	}, res.logs)
});
