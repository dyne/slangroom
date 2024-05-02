// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { zencode } from '@slangroom/zencode';
import type { JsonableObject } from '@slangroom/shared';


test('run zencode without conf and extra', async (t) => {
	const scriptCreate = `
Rule unknown ignore
Given I send keys 'neo_keys' and send script 'neo_script' and send data 'neo_data' and execute zencode and output into 'ecdh_public_key'
Given I have a 'string dictionary' named 'ecdh_public_key'
Then print data
`;
	const slangroom = new Slangroom(zencode);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			neo_keys: {
				keyring: {
					ecdh: "FJ5Esc1koLSH+9pKSdI65tcyH2HowzXMe0UdsqktmZU=",
				}
			},
			neo_data: {},
			neo_script: `
				Scenario 'ecdh': Create the public key
				Given I have the 'keyring'
				When I create the ecdh public key
				Then print the 'ecdh public key'
			`
		},
	});
	t.deepEqual((res.result['ecdh_public_key'] as JsonableObject), {
   ecdh_public_key: "BLOYXryyAI7rPuyNbI0/1CfLFd7H/NbX+osqyQHjPR9BPK1lYSPOixZQWvFK+rkkJ+aJbYp6kii2Y3+fZ5vl2MA="
	});

});

test('run zencode', async (t) => {
	const scriptCreate = `
Rule unknown ignore
Given I send keys 'neo_keys' and send script 'neo_script' and send data 'neo_data' and send conf 'neo_conf' and send extra 'neo_extra' and execute zencode and output into 'ecdh_public_key'
Given I have a 'string dictionary' named 'ecdh_public_key'
Then print data
`;
	const slangroom = new Slangroom(zencode);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			neo_keys: {
				keyring: {
					ecdh: "FJ5Esc1koLSH+9pKSdI65tcyH2HowzXMe0UdsqktmZU=",
				}
			},
			neo_conf: "",
			neo_data: {},
			neo_extra: {},
			neo_script: `
				Scenario 'ecdh': Create the public key
				Given I have the 'keyring'
				When I create the ecdh public key
				Then print the 'ecdh public key'
			`
		},
	});
	t.deepEqual((res.result['ecdh_public_key'] as JsonableObject), {
   ecdh_public_key: "BLOYXryyAI7rPuyNbI0/1CfLFd7H/NbX+osqyQHjPR9BPK1lYSPOixZQWvFK+rkkJ+aJbYp6kii2Y3+fZ5vl2MA="
	});

});

test('run zencode that fails', async (t) => {
	const scriptCreate = `
Rule unknown ignore
Given I send keys 'neo_keys' and send script 'neo_script' and send data 'neo_data' and send conf 'neo_conf' and send extra 'neo_extra' and execute zencode and output into 'something'
Given I have a 'string dictionary' named 'ecdh_public_key'
Then print data
`;
	const slangroom = new Slangroom(zencode);
	const fn = slangroom.execute(scriptCreate, {
		keys: {
			neo_keys: {},
			neo_conf: "",
			neo_data: {},
			neo_extra: {},
			neo_script: `
				Given I have the 'string' named 'variable_that_does_not_exists'
				Then print the string 'this should fail'
			`
		},
	});
	const error = await t.throwsAsync(fn);
	t.true(((error as Error).message).includes("[!] Zencode runtime error"));
    t.true(((error as Error).message).includes("Zencode line 2: Given I have the 'string' named 'variable_that_does_not_exists'"));
});
