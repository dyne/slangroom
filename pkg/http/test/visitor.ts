import test from 'ava';
import { lex, parse, type PhraseCst, RequestKind, RequestMethod, visit } from '@slangroom/http';

const astify = (line: string) => {
	const { tokens } = lex(line);
	const { cst } = parse(tokens);
	return visit(cst as PhraseCst);
};

test('ast is okay', async (t) => {
	const cases = {
		'do  get	': { method: RequestMethod.Get, kind: RequestKind.Default },
		' do  	post': { method: RequestMethod.Post, kind: RequestKind.Default },
		'do	same	post': { method: RequestMethod.Post, kind: RequestKind.Same },
		'	do parallel post  ': { method: RequestMethod.Post, kind: RequestKind.Parallel },
	};
	for (const [line, astWant] of Object.entries(cases)) {
		const astHave = astify(line);
		t.deepEqual(astHave, astWant);
	}
});
