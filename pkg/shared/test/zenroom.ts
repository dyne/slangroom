import test from 'ava';
import { convZenParams, zencodeExec, ZenroomError } from '@slangroom/shared/zenroom';

test('convZenParams() works', (t) => {
	// Since TS already covers our butts regarding type checks, we just
	// need to convice the coverage here that all the code paths are
	// taken.

	// Given I have a valid "data" and "keys" value
	const data = { "doesn't really": 'matter' };
	const keys = { "doesn't": 'really matter' };

	{
		// When I provide an undefined params
		const result = convZenParams(undefined);
		// Then the result must be an empty object
		t.deepEqual(result, {});
	}

	{
		// When I provide empty params
		const result = convZenParams({});
		// Then the result must be an empty object
		t.deepEqual(result, {});
	}

	{
		// When I provide only the ""
		const result = convZenParams({ data: data });
		// Then the result must be JSON.strigify()'d "data"
		t.deepEqual(result, { data: JSON.stringify(data) });
	}

	{
		// When I provide only the "keys"
		const result = convZenParams({ keys: keys });
		// Then the result must be JSON.strigify()'d "keys"
		t.deepEqual(result, { keys: JSON.stringify(keys) });
	}

	{
		// When I provide both the "data" and "keys"
		const result = convZenParams({ data: data, keys: keys });
		// Then the result must be JSON.strigify()'d "keys"
		t.deepEqual(result, { data: JSON.stringify(data), keys: JSON.stringify(keys) });
	}
});

test("zencodeExec(): doesn't throw with valid input", async (t) => {
	// Given I have a valid contract
	const contract = `Given I have nothing
Then I print the string 'I love you'
`;
	// When I execute the contract
	const { result } = await zencodeExec(contract);
	// Then it must have a result, thus it's not an error
	t.deepEqual(result, { output: ['I_love_you'] });
});

test('zencodeExec(): throws with invalid input', async (t) => {
	// Given I have an invalid contract
	const contract = "I'm invalid.";
	// When I execute the contract
	const promise = zencodeExec(contract);
	// Then it must throw some errors
	await t.throwsAsync(promise, { instanceOf: ZenroomError });
});
