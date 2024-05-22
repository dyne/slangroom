// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { getIgnoredStatements } from '@slangroom/ignored';

const stripAnsiCodes = (str: string | undefined) => str && str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

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
	const ignoreds = await getIgnoredStatements(contract);
	// Then it must be the given unknown statements
	t.deepEqual(ignoreds, {
		ignoredLines: [
			['Given I test the rule with a statement that does not exist 1', 3],
			['Given I test the rule with a statement that does not exist 2', 4],
			['Given I test the rule with a statement that does not exist 2', 5],
			['Given I test the rule with a statement that does not exist 3', 6],
		],
		invalidLines: [],
	});
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
When I move 'timestamp' in 'outputData'
When I move 'random-from-endpoint' in 'outputData'

# ECDSA signature
When I create the ecdh key
When I create the signature of 'outputData'
When I rename the 'signature' to 'outputData.signature'

# Printing the output
Then print the 'outputData'
Then print the 'outputData.signature'
`;
	// When I get the ignored statements
	const ignoreds = await getIgnoredStatements(contract);
	// Then it must be equal to the statements of restroom
	t.deepEqual(ignoreds, {
		ignoredLines: [
			["Given that I have an endpoint named 'endpoint'", 7],
			["Given that I have an endpoint named 'timeServer'", 8],
			["Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'", 11],
			["Given I connect to 'timeServer' and save the output into 'timestamp-output'", 12],
		],
		invalidLines: [],
	});
});

test("Report invalid statement correctly", async (t) => {
	const contract = `Not a valid statement
Given gibberish
Another not valid statement
Given nothing
Not a valid statement
Then print the data
Then gibberish
`;
	const ignoreds = await getIgnoredStatements(contract);
	t.deepEqual(ignoreds.ignoredLines, []);
	t.is(ignoreds.invalidLines.length, 5);
	t.is(ignoreds.invalidLines[0]?.lineNo, 1);
	t.is(stripAnsiCodes(ignoreds.invalidLines[0]?.message?.message),
		"Maybe missing: Rule unknown ignore\nInvalid Zencode prefix");
	t.is(ignoreds.invalidLines[1]?.lineNo, 2);
	t.true(stripAnsiCodes(ignoreds.invalidLines[1]?.message?.message)?.includes("Maybe missing: Rule unknown ignore\n"));
	t.true(ignoreds.invalidLines[1]?.message?.message.includes("Zencode line 2 pattern not found (given): Given gibberish"));
	t.is(ignoreds.invalidLines[2]?.lineNo, 3);
	t.is(stripAnsiCodes(ignoreds.invalidLines[2]?.message?.message), "Maybe missing: Rule unknown ignore\nInvalid Zencode prefix");
	t.is(ignoreds.invalidLines[3]?.lineNo, 5);
	t.is(ignoreds.invalidLines[3]?.message?.message, 'Invalid Zencode prefix');
	t.is(ignoreds.invalidLines[4]?.lineNo, 7);
	t.true(stripAnsiCodes(ignoreds.invalidLines[4]?.message?.message)?.includes("Maybe missing: Rule unknown ignore\n"));
	t.true(ignoreds.invalidLines[4]?.message?.message.includes("Zencode line 7 pattern not found (then): Then gibberish"))
});

test("Report invalid and ignored statement correctly", async (t) => {
	const contract = `Rule unknown ignore
Not a valid statement
Given gibberish
Another not valid statement
Given nothing
Not a valid statement
Then print the data
Then gibberish
`;
	const ignoreds = await getIgnoredStatements(contract);
	t.deepEqual(ignoreds.ignoredLines, [
		["Not a valid statement", 2],
		["Given gibberish", 3],
		["Another not valid statement", 4],
		["Then gibberish", 8]
	]);
	t.is(ignoreds.invalidLines.length, 1);
	t.is(ignoreds.invalidLines[0]?.lineNo, 6);
	t.is(stripAnsiCodes(ignoreds.invalidLines[0]?.message?.message), 'Invalid Zencode line');
});
