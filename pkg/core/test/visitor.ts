import test from 'ava';
import { lex } from '@slangroom/core/lexer';
import { parse } from '@slangroom/core/parser';
import { StatementType, visit } from '@slangroom/core/visitor';

const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};

test('generated ast is correct', async (t) => {
	const cases = {
		'read the    ethereum		 balance': {
			type: StatementType.Read,
			read: {
				phrase: 'the ethereum balance',
				args: [],
			},
		},
		"read		the ethereum balance of    'address' into 'bar'": {
			type: StatementType.ReadInto,
			read: {
				phrase: "the ethereum balance of ''",
				args: ['address'],
			},
			into: 'bar',
		},
		"read	 the ethereum		 balance of   'address' into 'bar' within 'foo'": {
			type: StatementType.ReadIntoWithin,
			read: {
				phrase: "the ethereum balance of ''",
				args: ['address'],
			},
			into: 'bar',
			within: 'foo',
		},
		"read the ethereum balance   	of 'address' and 		save in   the file 'baz'": {
			type: StatementType.ReadAndSave,
			read: {
				phrase: "the ethereum balance of ''",
				args: ['address'],
			},
			save: {
				phrase: "in the file ''",
				args: ['baz'],
			},
		},
		"connect  to	da cloudTM		using the 'address' over 'proxy'": {
			type: StatementType.Connect,
			connect: {
				phrase: "to da cloudTM using the '' over ''",
				args: ['address', 'proxy'],
			},
		},
		"read   the		current   	timestamp into    'ts'": {
			type: StatementType.ReadInto,
			read: {
				phrase: 'the current timestamp',
				args: [],
			},
			into: 'ts',
		},
		'read the current		 timestamp    and save it to console': {
			type: StatementType.ReadAndSave,
			read: {
				phrase: 'the current timestamp',
				args: [],
			},
			save: {
				phrase: 'it to console',
				args: [],
			},
		},
	};
	for (const [line, astWant] of Object.entries(cases)) {
		const astHave = astify(line);
		t.deepEqual(astHave, astWant);
	}
});
