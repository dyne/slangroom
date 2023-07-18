import { lex } from './lexer';
import { SaveThe, IntoTheFile } from './tokens';

import { Then, I, Identifier } from '@slangroom/shared/tokens';
import { getIgnoredStatements } from '@slangroom/ignored';

test('lexing works', async () => {
	// Given I have a contract with filesystem statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite0'
Given I have a 'string' named 'nameOfTheFile0'
Given I have a 'string' named 'stringToWrite1'
Given I have a 'string' named 'nameOfTheFile1'

Then I save the 'stringToWrite0' into the file 'nameOfTheFile0'
Then I save the 'stringToWrite1' into the file 'nameOfTheFile1'
`;
	// When I get the ignored statements of it
	const ignoreds = await getIgnoredStatements(contract, {
		data: {
			stringToWrite0: 'foo0',
			nameOfTheFile0: 'bar0',
			stringToWrite1: 'foo1',
			nameOfTheFile1: 'bar1',
		},
	});
	// and I lex each of them
	const lexeds = ignoreds.map((x) => lex(x));
	// Then the result must contain 2 items
	expect(lexeds).toHaveLength(2);

	// When I get the first one
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const first = lexeds[0]!;
	// Then it must have no errors
	expect(first.errors).toHaveLength(0);
	// and it must have 6 tokens
	expect(first.tokens).toHaveLength(6);
	// and those tokens must be these:
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	expect(first.tokens[0]!.tokenType).toStrictEqual(Then);
	expect(first.tokens[1]!.tokenType).toStrictEqual(I);
	expect(first.tokens[2]!.tokenType).toStrictEqual(SaveThe);
	expect(first.tokens[3]!.tokenType).toStrictEqual(Identifier);
	expect(first.tokens[4]!.tokenType).toStrictEqual(IntoTheFile);
	expect(first.tokens[5]!.tokenType).toStrictEqual(Identifier);
	/* eslint-enable */

	// When I get the second one
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const second = lexeds[0]!;
	// Then it must have no errors
	expect(second.errors).toHaveLength(0);
	// and it must have 6 tokens
	expect(second.tokens).toHaveLength(6);
	// and those tokens must be these:
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	expect(second.tokens[0]!.tokenType).toStrictEqual(Then);
	expect(second.tokens[1]!.tokenType).toStrictEqual(I);
	expect(second.tokens[2]!.tokenType).toStrictEqual(SaveThe);
	expect(second.tokens[3]!.tokenType).toStrictEqual(Identifier);
	expect(second.tokens[4]!.tokenType).toStrictEqual(IntoTheFile);
	expect(second.tokens[5]!.tokenType).toStrictEqual(Identifier);
	/* eslint-enable */
});
