import { lex } from './lexer';
import { ThenI, SaveThe, IntoTheFile } from './tokens';

import { Identifier } from '@slangroom/shared/tokens';

test('that lexing works', async () => {
	// Given I have a contract with filesystem statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite'
and I have a 'string' named 'nameOfTheFile'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
`;
	// When I lex it
	const lexed = await lex(contract, { data: { stringToWrite: 'foo', nameOfTheFile: 'bar' } });
	// Then the result must have no errors
	expect(lexed.errors).toHaveLength(0);
	// and it must have 5 tokens
	expect(lexed.tokens).toHaveLength(5);
	// and those tokens must be these:
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	expect(lexed.tokens[0]!.tokenType).toStrictEqual(ThenI);
	expect(lexed.tokens[1]!.tokenType).toStrictEqual(SaveThe);
	expect(lexed.tokens[2]!.tokenType).toStrictEqual(Identifier);
	expect(lexed.tokens[3]!.tokenType).toStrictEqual(IntoTheFile);
	expect(lexed.tokens[4]!.tokenType).toStrictEqual(Identifier);
	/* eslint-enable */
});
