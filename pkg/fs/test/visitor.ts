import test from 'ava';
import { visit } from '@slangroom/fs/visitor';
import { getIgnoredStatements } from '@slangroom/ignored';

test('ast is correct with one statement', async (t) => {
	// Given I have a contract with one filesystems statement in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite'
Given I have a 'string' named 'nameOfTheFile'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
`;
	const data = {
		stringToWrite: 'hello world',
		nameOfTheFile: 'hello-world.txt',
	};
	// When I get the ignored statements of it
	const ignoreds = await getIgnoredStatements(contract, {
		data: data,
	});
	// and I generate AST of each of them
	const asts = ignoreds.map((x) => visit(x));
	// Then the result must contain only one item
	t.is(asts?.length, 1);
	const ast = asts[0];
	// and its content must be "stringToWrite"
	t.is(ast?.content, 'stringToWrite');
	// and its filename must be "nameOfTheFile"
	t.is(ast?.filename, 'nameOfTheFile');
	// and the value indexed by its content in data must be data's stringToWrite
	t.is(data[ast?.content as 'stringToWrite'], data.stringToWrite);
	// and the value indexed by its filename in data must be data's nameOfTheFile
	t.is(data[ast?.filename as 'nameOfTheFile'], data.nameOfTheFile);
});

test('ast is correct with multiple statements', async (t) => {
	// Given I have a contract with multiple filesystems statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite0'
Given I have a 'string' named 'nameOfTheFile0'
Given I have a 'string' named 'stringToWrite1'
Given I have a 'string' named 'nameOfTheFile1'
Given I have a 'string' named 'stringToWrite2'
Given I have a 'string' named 'nameOfTheFile2'

Then I save the 'stringToWrite0' into the file 'nameOfTheFile0'
Then I save the 'stringToWrite1' into the file 'nameOfTheFile1'
Then I save the 'stringToWrite2' into the file 'nameOfTheFile2'
`;
	const data = {
		stringToWrite0: 'hello world0',
		nameOfTheFile0: 'hello-world0.txt',
		stringToWrite1: 'hello world1',
		nameOfTheFile1: 'hello-world1.txt',
		stringToWrite2: 'hello world2',
		nameOfTheFile2: 'hello-world2.txt',
	};
	// When I get the ignored statements of it
	const ignoreds = await getIgnoredStatements(contract, {
		data: data,
	});
	// And I generate AST of each of them
	const asts = ignoreds.map((x) => visit(x));
	// Then the result must contain 3 items
	t.is(asts.length, 3);
	// And I get the first one
	const first = asts[0];
	// And the its content must be "stringToWrite0"
	t.is(first?.content, 'stringToWrite0');
	// And the its filename must be "nameOfTheFile"
	t.is(first?.filename, 'nameOfTheFile0');
	// And the value indexed by its content in data must be data's stringToWrite0
	t.is(data[first?.content as 'stringToWrite0'], data.stringToWrite0);
	// And the value indexed by its filename in data must be data's nameOfTheFile0
	t.is(data[first?.filename as 'nameOfTheFile0'], data.nameOfTheFile0);

	// Then get the second one
	const second = asts[1];
	// and the its content must be "stringToWrite0"
	t.is(second?.content, 'stringToWrite1');
	// and the its filename must be "nameOfTheFile"
	t.is(second?.filename, 'nameOfTheFile1');
	// and the value indexed by its content in data must be data's stringToWrite1
	t.is(data[second?.content as 'stringToWrite1'], data.stringToWrite1);
	// and the value indexed by its filename in data must be data's nameOfTheFile1
	t.is(data[second?.filename as 'nameOfTheFile1'], data.nameOfTheFile1);

	// Then I get the third one
	const third = asts[2];
	// And the its content must be "stringToWrite2"
	t.is(third?.content, 'stringToWrite2');
	// And the its filename must be "nameOfTheFile"
	t.is(third?.filename, 'nameOfTheFile2');
	// And the value indexed by its content in data must be data's stringToWrite2
	t.is(data[third?.content as 'stringToWrite2'], data.stringToWrite2);
	// And the value indexed by its filename in data must be data's nameOfTheFile2
	t.is(data[third?.filename as 'nameOfTheFile2'], data.nameOfTheFile2);
});
