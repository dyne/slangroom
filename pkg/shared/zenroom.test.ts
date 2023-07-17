import { convZenParams, zencodeExec, ZenroomError } from './zenroom';

test('convZenParams() works', () => {
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
		expect(result).toStrictEqual({});
	}

	{
		// When I provide empty params
		const result = convZenParams({});
		// Then the result must be an empty object
		expect(result).toStrictEqual({});
	}

	{
		// When I provide only the ""
		const result = convZenParams({ data: data });
		// Then the result must be JSON.strigify()'d "data"
		expect(result).toStrictEqual({ data: JSON.stringify(data) });
	}

	{
		// When I provide only the "keys"
		const result = convZenParams({ keys: keys });
		// Then the result must be JSON.strigify()'d "keys"
		expect(result).toStrictEqual({ keys: JSON.stringify(keys) });
	}

	{
		// When I provide both the "data" and "keys"
		const result = convZenParams({ data: data, keys: keys });
		// Then the result must be JSON.strigify()'d "keys"
		expect(result).toStrictEqual({ data: JSON.stringify(data), keys: JSON.stringify(keys) });
	}
});

describe('zencodeExec()', () => {
	test("doesn't throw with valid input", async () => {
		// Given I have a valid contract
		const contract = `Given I have nothing
Then I print string 'I love you'
`;
		// When I execute the contract
		const promise = zencodeExec(contract);
		// Then it must not throw any errors
		await expect(promise).resolves.toBeTruthy();
	});

	test('throws with invalid input', async () => {
		// Given I have an invalid contract
		const contract = "I'm invalid.";
		// When I execute the contract
		const promise = zencodeExec(contract);
		// Then it must throw some errors
		await expect(promise).rejects.toThrow(ZenroomError);
	});
});
