import { getIgnoredStatements } from './index';

test("zenroom ignores statements it doesn't know in general", async () => {
	// Given I have a contract with a general rule unknown statemets in it
	const uknowns = [
		'When I test the rule with a statement that does not exist 1',
		'When I test the rule with a statement that does not exist 2',
		'When I test the rule with a statement that does not exist 2',
		'When I test the rule with a statement that does not exist 3',
	];
	const contract = `Rule unknown ignore

Given nothing
${uknowns.join('\n')}
When I write string 'test passed' in 'result'
Then print the data
`;
	// When I get the unknown statements
	const { statements } = await getIgnoredStatements(contract);
	// Then it must be the given unknown statements
	expect(statements).toStrictEqual(uknowns);
});

test("zenroom doesn't ignore ecdh but ignores restroom statements", async () => {
	// Given I have a contract with ecdh and restroom statements
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
	// and params to zenroom
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
	const { statements } = await getIgnoredStatements(contract, { data: data });
	// Then it must be equal to the statements of restroom
	expect(statements).toStrictEqual([
		"Given that I have an endpoint named 'endpoint'",
		"Given that I have an endpoint named 'timeServer'",
		"Given I connect to 'endpoint' and save the output into 'dataFromEndpoint'",
		"Given I connect to 'timeServer' and save the output into 'timestamp-output'",
	]);
});
