// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🥷  omits elements', async (t) => {
    const omitter = `Rule unknown ignore
Given I send object 'the_object' and send paths 'the_path' and manipulate and omit and output into 'result'

Given I have a 'string dictionary' named 'result'
Then print the 'result'
`;
	const slangroom = new Slangroom(helpers);
	const res = await slangroom.execute(omitter, {
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
			"the_path": [
				"names.third",
				"surnames.second",
			]
		},
	});
	t.deepEqual(res.result, {
        result: {
			names: {
				first: 'Bella'
			},
			surnames: {
				first: 'Allen'
			},
		},
	}, res.logs)
});
