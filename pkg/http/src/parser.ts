import { CstParser, type IToken, type CstNode } from '@slangroom/deps/chevrotain';
import {
	allTokens,
	Do,
	Get,
	Post,
	Patch,
	Put,
	Delete,
	Sequential,
	Parallel,
	Same,
} from '@slangroom/http';

export type PhraseCst = CstNode & {
	children: {
		kind: KindCst;
		method: MethodCst;
	};
};

export type KindCst = CstNode & {
	children: { Sequential: [IToken] } | { Parallel: [IToken] } | { Same: [IToken] };
};

export type MethodCst = CstNode & {
	children:
		| { Get: [IToken] }
		| { Post: [IToken] }
		| { Patch: [IToken] }
		| { Put: [IToken] }
		| { Delete: [IToken] };
};

const Parser = new (class extends CstParser {
	constructor() {
		super(allTokens);
		this.performSelfAnalysis();
	}

	phrase = this.RULE('phrase', () => {
		this.CONSUME(Do);
		this.OPTION(() => this.SUBRULE(this.#kind));
		this.SUBRULE(this.#method);
	});

	#method = this.RULE('method', () => {
		this.OR([
			{ ALT: () => this.CONSUME(Get) },
			{ ALT: () => this.CONSUME(Post) },
			{ ALT: () => this.CONSUME(Patch) },
			{ ALT: () => this.CONSUME(Put) },
			{ ALT: () => this.CONSUME(Delete) },
		]);
	});

	#kind = this.RULE('kind', () => {
		this.OR([
			{ ALT: () => this.CONSUME(Sequential) },
			{ ALT: () => this.CONSUME(Parallel) },
			{ ALT: () => this.CONSUME(Same) },
		]);
	});
})();

export const CstVisitor = Parser.getBaseCstVisitorConstructor();

export const parse = (tokens: IToken[]) => {
	Parser.input = tokens;
	return {
		cst: Parser.phrase(),
		errors: Parser.errors,
	};
};
