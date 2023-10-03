import {
	allTokens,
	Read,
	Connect,
	Save,
	Send,
	Pass,
	Within,
	And,
	To,
	Into,
	Buzzword,
	Identifier,
} from '@slangroom/core/tokens';
import { CstParser, type IToken } from '@slangroom/deps/chevrotain';

const Parser = new (class extends CstParser {
	constructor() {
		super(allTokens);
		this.performSelfAnalysis();
	}

	statements = this.RULE('statements', () => {
		this.AT_LEAST_ONE_SEP({
			SEP: And,
			DEF: () => this.SUBRULE(this.#statement),
		});
	});

	#statement = this.RULE('statement', () => {
		this.OPTION1(() => this.SUBRULE(this.#connect));
		this.MANY(() => {
			this.SUBRULE(this.#sendpass);
		});
		this.SUBRULE(this.#readsave);
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
		this.OPTION(() => this.SUBRULE(this.#buzzwords));
		this.CONSUME(Identifier);
		this.CONSUME(And);
	});

	#readsave = this.RULE('readsave', () => {
		this.OR([{ ALT: () => this.SUBRULE(this.#read) }, { ALT: () => this.SUBRULE(this.#save) }]);
	});

	#save = this.RULE('save', () => {
		this.CONSUME(Save);
		this.SUBRULE(this.#buzzwords);
	});

	#read = this.RULE('read', () => {
		this.CONSUME(Read);
		this.SUBRULE(this.#buzzwords);
		this.OPTION(() => this.SUBRULE(this.#into));
	});

	#into = this.RULE('into', () => {
		this.CONSUME(Into);
		this.CONSUME(Identifier);
		this.OPTION(() => this.SUBRULE(this.#within));
	});

	#within = this.RULE('within', () => {
		this.CONSUME(Within);
		this.CONSUME(Identifier);
	});

	#buzzwords = this.RULE('buzzwords', () => {
		this.AT_LEAST_ONE(() => this.CONSUME(Buzzword));
	});
})();

export const CstVisitor = Parser.getBaseCstVisitorConstructor();

export const parse = (tokens: IToken[]) => {
	Parser.input = tokens;

	const res = Parser.statements();
	console.log(Parser.errors)
	return res
};
