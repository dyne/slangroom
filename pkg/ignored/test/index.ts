// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { getIgnoredStatements } from '@slangroom/ignored';

test("zenroom ignores statements it doesn't know in general", async (t) => {
	const contract = `Rule unknown ignore

Given I test the rule with a statement that does not exist 1
Given I test the rule with a statement that does not exist 2
Given I test the rule with a statement that does not exist 2
Given I test the rule with a statement that does not exist 3
Given nothing
When I write string 'test passed' in 'result'
Then print the data
`;
	// When I get the unknown statements
	const ignoreds = await getIgnoredStatements(contract, { data: {}, keys: {} });
	// Then it must be the given unknown statements
	t.deepEqual(ignoreds, [
		['Given I test the rule with a statement that does not exist 1', 3],
		['Given I test the rule with a statement that does not exist 2', 4],
		['Given I test the rule with a statement that does not exist 2', 5],
		['Given I test the rule with a statement that does not exist 3', 6],
	]);
});

test("zenroom doesn't ignore ecdh but ignores restroom statements", async (t) => {
	// Given I have a contract with ecdh and restroom statements
	const contract = `# Always use 'Rule unknown ignore' when using Restroom
Rule unknown ignore
# we'll need to create a keyring to produce an ECDSA signature later
Scenario 'ecdh': Create the keyring

# Those are restroom-mw statements: define the endpoints
Given that I have an endpoint named 'endpoint'
Given that I have an endpoint named 'timeServer'

# Those are restroom-mw statements: connect to endpoints and store their output into Zenroom's objects
Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'
Given I connect to 'timeServer' and save the output into 'timestamp-output'

Given that I am known as 'Alice'

# We need those object to store the output of the endpoints
Given I have a 'string dictionary' named 'dataFromEndpoint'
Given I have a 'string dictionary' named 'timestamp-output'

# The output of a GET is always an object containing the string 'status' (200, 404, 500 etc)
# as well as the output of the query, named 'result' which can be meaningful data or an error message.
# Therefore, we want to extract the result and reanme it
When I create the copy of 'result' from dictionary 'timestamp-output'
When I rename the 'copy' to 'timestamp'

When I create the copy of 'result' from dictionary 'dataFromEndpoint'
When I rename the 'copy' to 'random-from-endpoint'

# Create a string dictionary to format the output
When I create the 'string dictionary'
and I rename the 'string dictionary' to 'outputData'

# Organize the output of the endpoints in the string dictionary
When I insert 'timestamp' in 'outputData'
When I insert 'random-from-endpoint' in 'outputData'

# ECDSA signature
When I create the ecdh key
When I create the signature of 'outputData'
When I rename the 'signature' to 'outputData.signature'

# Printing the output
Then print the 'outputData'
Then print the 'outputData.signature'
`;
	// And params to zenroom
	const data = {
		endpoint: 'https://apiroom.net/api/dyneorg/512-bits-random-generator',
		timeServer: 'http://showcase.api.linx.twenty57.net/UnixTime/tounix?date=now',
		dataFromEndpoint: {
			result: '',
		},
		'timestamp-output': {
			result: '',
		},
	};
	// When I get the ignored statements
	const ignoreds = await getIgnoredStatements(contract, { data: data, keys: {} });
	// Then it must be equal to the statements of restroom
	t.deepEqual(ignoreds, [
		["Given that I have an endpoint named 'endpoint'", 7],
		["Given that I have an endpoint named 'timeServer'", 8],
		["Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'", 11],
		["Given I connect to 'timeServer' and save the output into 'timestamp-output'", 12],
	]);
});
