import {
	allTokens,
	Read,
	Connect,
	Save,
	Within,
	And,
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

	statement = this.RULE('statement', () => {
		this.OR([
			{ ALT: () => this.SUBRULE(this.#connect) },
			{ ALT: () => this.SUBRULE(this.#read) },
		]);
	});

	#connect = this.RULE('connect', () => {
		this.CONSUME(Connect);
		this.SUBRULE(this.#action);
	});

	#read = this.RULE('read', () => {
		this.CONSUME(Read);
		this.SUBRULE(this.#action, { LABEL: 'readAction' });
		this.OPTION(() =>
			this.OR([
				{ ALT: () => this.SUBRULE(this.#andSave) },
				{ ALT: () => this.SUBRULE(this.#into) },
			])
		);
	});

	#andSave = this.RULE('andSave', () => {
		this.CONSUME(And);
		this.CONSUME(Save);
		this.SUBRULE(this.#action, { LABEL: 'saveAction' });
	});

	#into = this.RULE('into', () => {
		this.CONSUME(Into);
		this.CONSUME(Identifier, { LABEL: 'intoIdentifier' });
		this.OPTION(() => this.SUBRULE(this.#within));
	});

	#within = this.RULE('within', () => {
		this.CONSUME(Within);
		this.CONSUME(Identifier, { LABEL: 'withinIdentifier' });
	});

	#action = this.RULE('action', () => {
		this.AT_LEAST_ONE(() => this.SUBRULE(this.#phrase));
	});

	#phrase = this.RULE('phrase', () => {
		this.CONSUME(Buzzword);
		this.OPTION(() => this.CONSUME(Identifier));
	});
})();

export const CstVisitor = Parser.getBaseCstVisitorConstructor();

export const parse = (tokens: IToken[]) => {
	Parser.input = tokens;
	return Parser.statement();
};
