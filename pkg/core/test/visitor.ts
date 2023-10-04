import test from 'ava';
import { lex } from '@slangroom/core/lexer';
import { parse } from '@slangroom/core/parser';
import { ActionType, visit } from '@slangroom/core/visitor';

const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};

test('generated ast is correct', async (t) => {
	const cases = {
		'read the    ethereum		 balance': [{
			action: {
				kind: ActionType.Read,
				buzzwords: "the ethereum balance",
				into: []
			},
			bindings: new Map<string, string>()
		}],
		"pass address 'addr'  and send 'contract' and read the    ethereum		 balance": [{
			action: {
				kind: ActionType.Read,
				buzzwords: "the ethereum balance",
				into: []
			},
			bindings: new Map<string, string>([
				["address","addr"],
				["contract","contract"],
			])
		}],
		"connect to 'foo' and read the    ethereum		 balance": [{
			connect: 'foo',
			action: {
				kind: ActionType.Read,
				buzzwords: "the ethereum balance",
				into: []
			},
			bindings: new Map<string, string>()
		}],
		"connect to 'foo' and pass address 'addr'  and send 'contract' and read the    ethereum		 balance": [{
			connect: 'foo',
			action: {
				kind: ActionType.Read,
				buzzwords: "the ethereum balance",
				into: []
			},
			bindings: new Map<string, string>([
				["address","addr"],
				["contract","contract"],
			])
		}],
	};
	for (const [line, astWant] of Object.entries(cases)) {
		const astHave = astify(line);
		t.deepEqual(astHave, astWant);
	}
});
