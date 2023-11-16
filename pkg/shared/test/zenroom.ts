import test from 'ava';
import { zencodeExec, ZenError } from '@slangroom/shared';

test("zencodeExec(): doesn't throw with valid input", async (t) => {
	const contract = `Given I have nothing
Then I print the string 'I love you'
`;
	const { result } = await zencodeExec(contract, { data: {}, keys: {} });
	t.deepEqual(result, { output: ['I_love_you'] });
});

test('zencodeExec(): throws with invalid input', async (t) => {
	const contract = "I'm invalid.";
	const promise = zencodeExec(contract, { data: {}, keys: {} });
	await t.throwsAsync(promise, { instanceOf: ZenError });
});

test('zencodeExec(): pass conf', async (t) => {
	const contract = `
Scenario 'ecdh': Create the key
Given nothing
When I create the ecdh key
Then print the 'keyring'
`;
	const res = await zencodeExec(contract, {
		data: {},
		extra: {},
		keys: {},
		conf: 'debug=3, rngseed=hex:74eeeab870a394175fae808dd5dd3b047f3ee2d6a8d01e14bff94271565625e98a63babe8dd6cbea6fedf3e19de4bc80314b861599522e44409fdd20f7cd6cfc',
	});
	t.deepEqual(res.result, {
		keyring: { ecdh: 'Aku7vkJ7K01gQehKELav3qaQfTeTMZKgK+5VhaR3Ui0=' },
	});
});
