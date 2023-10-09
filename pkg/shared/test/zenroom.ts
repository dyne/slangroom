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
