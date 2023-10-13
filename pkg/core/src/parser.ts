import {
	allTokens,
	And,
	Buzzword,
	Connect,
	Open,
	Identifier,
	Into,
	Output,
	Pass,
	Send,
	To,
} from '@slangroom/core/tokens';
import { CstParser, type IToken, type CstNode } from '@slangroom/deps/chevrotain';

export type StatementCst = CstNode & {
	children: {
		openconnect?: OpenconnectCst;
		sendpass: SendpassCst[];
		phrase: PhraseCst;
		into?: IntoCst;
	};
};

export type OpenconnectCst = CstNode & {
	children: { Identifier: [IToken] };
};

export type SendpassCst = CstNode & {
	children: ({ Send: [IToken] } | { Pass: [IToken] }) & {
		phrase: PhraseCst;
		Identifier: [IToken];
	};
};

export type PhraseCst = CstNode & {
	children: {
		Buzzword: [IToken, ...IToken[]];
	};
};

export type IntoCst = CstNode & {
	children: { Identifier: [IToken] };
};

const Parser = new (class extends CstParser {
	constructor() {
		super(allTokens);
		this.performSelfAnalysis();
	}

	statement = this.RULE('statement', () => {
		this.OPTION1(() => this.SUBRULE(this.#openconnect));
		this.MANY(() => this.SUBRULE(this.#sendpass));
		this.SUBRULE(this.#phrase);
		this.OPTION2(() => this.SUBRULE(this.#into));
	});

	#openconnect = this.RULE('openconnect', () => {
		this.OR([
			{ ALT: () => this.CONSUME(Open) },
			{
				ALT: () => {
					this.CONSUME(Connect);
					this.CONSUME(To);
				},
			},
		]);
		this.CONSUME(Identifier);
		this.CONSUME(And);
	});

	#sendpass = this.RULE('sendpass', () => {
		this.OR([{ ALT: () => this.CONSUME(Send) }, { ALT: () => this.CONSUME(Pass) }]);
		this.SUBRULE(this.#phrase);
		this.CONSUME(Identifier);
		this.CONSUME(And);
	});

	#phrase = this.RULE('phrase', () => {
		this.AT_LEAST_ONE(() => this.CONSUME(Buzzword));
	});

	#into = this.RULE('into', () => {
		this.CONSUME(And);
		this.CONSUME(Output);
		this.CONSUME(Into);
		this.CONSUME(Identifier);
	});
})();

export const CstVisitor = Parser.getBaseCstVisitorConstructor();

export const parse = (tokens: IToken[]) => {
	Parser.input = tokens;
	return {
		cst: Parser.statement(),
		errors: Parser.errors,
	};
};
