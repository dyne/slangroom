import { visit } from './visitor';

test('that', async () => {
	// Given I have a contract with filesystem statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite'
and I have a 'string' named 'nameOfTheFile'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
`;
	await visit(contract, {
		data: { stringToWrite: 'hello world', nameOfTheFile: 'hello-world.txt' },
	});

	expect(true).toStrictEqual(true);
});
