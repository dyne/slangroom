// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { helpers } from '@slangroom/helpers';
import test from 'ava';

test('@slangroom/helpers 🧹 delete', async (t) => {
	const setter = `Rule unknown ignore
Given I have a 'string dictionary' named 'the_object'
Given I have a 'string dictionary' named 'mimmo'

Then print 'mimmo'
Then print 'the_object'
Then I manipulate and delete and output into 'mimmo'
`;
	const slangroom = new Slangroom(helpers);
	const res = await slangroom.execute(setter, {
		data: {
			"mimmo": {
				"a": "b"
			},
			"the_object": {
				"name": "mimmo"
			},
		},
	});
	t.deepEqual(res.result, {
		the_object: {
			name: 'mimmo',
		},
	}, res.logs)
});
