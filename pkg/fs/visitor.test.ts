import { visit } from './visitor';

test('ast is correct', async () => {
	// Given I have a contract with filesystem statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite'
and I have a 'string' named 'nameOfTheFile'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
`;
	// When I generate ast of the contract
	const data = {
		stringToWrite: 'hello world',
		nameOfTheFile: 'hello-world.txt',
	};
	const ast = await visit(contract, { data: data });
	// Then the content must be "stringToWrite"
	expect(ast.content).toStrictEqual('stringToWrite');
	// and the filename must be "nameOfTheFile"
	expect(ast.filename).toStrictEqual('nameOfTheFile');
	// and the value indexed by the content in data must be "hello world"
	expect(data[ast.content as 'stringToWrite']).toStrictEqual('hello world');
	// and the value indexed by the filename in data must be "hello-world.txt"
	expect(data[ast.filename as 'nameOfTheFile']).toStrictEqual('hello-world.txt');
});
