import {
	allTokens,
	And,
	Buzzword,
	Connect,
	Identifier,
	Into,
	Output,
	Pass,
	Send,
	To,
} from '@slangroom/core/tokens';
import { CstParser, type IToken } from '@slangroom/deps/chevrotain';

const Parser = new (class extends CstParser {
	constructor() {
		super(allTokens);
		this.performSelfAnalysis();
	}

	statement = this.RULE('statement', () => {
		this.OPTION1(() => this.SUBRULE(this.#connect));
		this.MANY(() => {
			this.SUBRULE(this.#sendpass);
		});
		this.SUBRULE(this.#buzzwords);
		this.OPTION(() => {
			this.SUBRULE(this.#into);
		});
	});

	#connect = this.RULE('connect', () => {
		this.CONSUME(Connect);
		this.CONSUME(To);
		this.CONSUME(Identifier);
		this.CONSUME(And);
	});

	#sendpass = this.RULE('sendpass', () => {
		this.OR([
			{
				ALT: () => this.CONSUME(Send),
			},
			{
				ALT: () => this.CONSUME(Pass),
			},
		]);
		this.SUBRULE(this.#buzzwords);
		this.CONSUME(Identifier);
		this.CONSUME(And);
	});

	#into = this.RULE('into', () => {
		this.CONSUME(And);
		this.CONSUME(Output);
		this.CONSUME(Into);
		this.CONSUME(Identifier);
	});

	#buzzwords = this.RULE('buzzwords', () => {
		this.AT_LEAST_ONE(() => this.CONSUME(Buzzword));
	});
})();

export const CstVisitor = Parser.getBaseCstVisitorConstructor();

export const parse = (tokens: IToken[]) => {
	Parser.input = tokens;

	const res = Parser.statement();
	console.log(Parser.errors)
	return res
};
