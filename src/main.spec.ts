import { tokenMatcher } from 'chevrotain';
import { WhiteSpace, Comment } from './tokens';
import { scan, tokenize } from './main';

test('tokens and identifiers are handeld correctly', () => {
	const contract = `# Given nothing
'one' # and another comment
'two'
	`;
	const result = tokenize(contract);

	expect(result.errors.length).toBe(0);
	expect(result.tokens.length).toBe(2);
	expect(result.groups['comments'].length).toBe(2);
	expect(result.groups['comments'][0].image).toBe('# Given nothing');
	expect(result.groups['comments'][1].image).toBe('# and another comment');
	expect(result.tokens[0].image).toBe("'one'");
	expect(result.tokens[1].image).toBe("'two'");

	result.tokens.map((t) => {
		expect(tokenMatcher(t, WhiteSpace)).toBe(false);
	});

	expect(tokenMatcher(result.groups['comments'][0], Comment)).toBe(true);
	expect(tokenMatcher(result.groups['comments'][1], Comment)).toBe(true);
});

test('wrong tokens print error', () => {
	const contract = `broken contract`;
	const result = tokenize(contract);
	const errors = [
		{
			offset: 0,
			line: 1,
			column: 1,
			length: 6,
			message: 'unexpected character: ->b<- at offset: 0, skipped 6 characters.'
		},
		{
			offset: 7,
			line: 1,
			column: 2,
			length: 8,
			message: 'unexpected character: ->c<- at offset: 7, skipped 8 characters.'
		}
	];
	expect(result.errors.length).toBe(2);
	expect(result.errors).toEqual(errors);
});

test('skipped tokens should be skipped', () => {
	const contract = "given I am 'alice'";
	const r = tokenize(contract);
	expect(r.tokens.length).toBe(1);
	expect(r.tokens[0].image).toBe("'alice'");
});

test('given some zencode get just ignored sentences', async () => {
	const contract = `Rule unknown ignore

Given nothing
When I test the rule with a statement that does not exist 1
When I test the rule with a statement that does not exist 2
When I test the rule with a statement that does not exist 2
When I test the rule with a statement that does not exist 3
When I write string 'test passed' in 'result'
Then print the data
`;
	const result = await scan(contract);
	expect(result).toEqual([
		'When I test the rule with a statement that does not exist 1',
		'When I test the rule with a statement that does not exist 2',
		'When I test the rule with a statement that does not exist 2',
		'When I test the rule with a statement that does not exist 3'
	]);
});

test('restroom contracts show correct', async () => {
	const contract = `# Always use 'Rule caller restroom-mw' when using Restroom
Rule caller restroom-mw


# we'll need to create a keyring to produce an ECDSA signature later
Scenario 'ecdh': Create the keyring
Given that I am known as 'Alice'

# Those are restroom-mw statements: define the endpoints
Given that I have an endpoint named 'endpoint' 
Given that I have an endpoint named 'timeServer' 

# We need those object to store the output of the endpoints
Given I have a 'string dictionary' named 'dataFromEndpoint'
Given I have a 'string dictionary' named 'timestamp-output'

# Those are restroom-mw statements: connect to endpoints and store their output into Zenroom's objects
Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'
Given I connect to 'timeServer' and save the output into 'timestamp-output'

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
	const data = {
		endpoint: 'https://apiroom.net/api/dyneorg/512-bits-random-generator',
		timeServer: 'http://showcase.api.linx.twenty57.net/UnixTime/tounix?date=now',
		dataFromEndpoint: {
			result: ''
		},
		'timestamp-output': {
			result: ''
		}
	};
	const result = await scan(contract, JSON.stringify(data));
	expect(result).toEqual([
		"Given that I have an endpoint named 'endpoint'",
		"Given that I have an endpoint named 'timeServer'",
		"Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'",
		"Given I connect to 'timeServer' and save the output into 'timestamp-output'"
	]);
});