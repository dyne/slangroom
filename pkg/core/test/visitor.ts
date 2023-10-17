import test from 'ava';
import { lex, parse, visit, ErrorKeyExists, type StatementCst } from '@slangroom/core';

const astify = (line: string) => {
	const { tokens } = lex(line);
	const { cst } = parse(tokens);
	return visit(cst as StatementCst);
};

test('generated ast is correct', async (t) => {
	const cases = {
		'read the    ethereum		 balance': {
			phrase: 'read the ethereum balance',
			bindings: new Map<string, string>(),
		},
		"send address 'addr'  and send contract 'contract' and read the    ethereum		 balance": {
			phrase: 'read the ethereum balance',
			bindings: new Map<string, string>([
				['address', 'addr'],
				['contract', 'contract'],
			]),
		},
		"connect to 'foo' and read the    ethereum		 balance": {
			openconnect: 'foo',
			phrase: 'read the ethereum balance',
			bindings: new Map<string, string>(),
		},
		"connect to 'foo' and pass address 'addr'  and send contract 'contract' and read the    ethereum		 balance":
		{
			openconnect: 'foo',
			phrase: 'read the ethereum balance',
			bindings: new Map<string, string>([
				['address', 'addr'],
				['contract', 'contract'],
			]),
		},
		"open 'foo' and pass address 'addr'  and send contract 'contract' and read the    ethereum		 balance and output into 'var'":
		{
			openconnect: 'foo',
			phrase: 'read the ethereum balance',
			bindings: new Map<string, string>([
				['address', 'addr'],
				['contract', 'contract'],
			]),
			into: 'var',
		},
	};

	for (const [line, astWant] of Object.entries(cases)) {
		const astHave = astify(line);
		t.deepEqual(astHave, astWant);
	}

	const err = t.throws(() => astify("send same 'x' and send same 'y' and does not matter"), {
		instanceOf: ErrorKeyExists,
	}) as ErrorKeyExists;
	t.is(err.message, 'key already exists: same');
});
