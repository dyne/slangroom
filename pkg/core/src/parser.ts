import { Lexicon } from '@slangroom/core';
import {
	CstParser,
	type IToken,
	type CstNode,
	type IOrAlt,
	type ConsumeMethodOpts,
} from '@slangroom/deps/chevrotain';

export type StatementCst = CstNode & {
	children: { [K in string]: [PhraseCst] };
};

export type PhraseCst = CstNode & {
	children: {
		connect?: [IToken];
	} & { open?: [IToken] } & { into?: [IToken] } & {
		[K in string]: [IToken | PhraseCst];
	};
};

export class Parser extends CstParser {
	#phrases: IOrAlt<unknown>[];
	#lexicon: Lexicon;

	constructor(lexicon: Lexicon, parsers: ((this: Parser) => void)[]) {
		super(lexicon.tokens, { maxLookahead: 1024 });
		this.#lexicon = lexicon;
		parsers = [...new Set(parsers)];
		parsers.forEach((p) => p.apply(this));
		this.#phrases = Object.entries(this).reduce((acc, [k, v]) => {
			if (k.endsWith('Phrase') && typeof v === 'function')
				acc.push({ ALT: () => this.SUBRULE(v) });
			return acc;
		}, [] as IOrAlt<unknown>[]);
		this.performSelfAnalysis();
	}

	/**
	 * {@inheritDoc Lexicon.token}
	 */
	#token(name: string) {
		return this.#lexicon.token(name);
	}

	tokenn(idx: number, name: string, opts?: ConsumeMethodOpts) {
		this.consume(idx, this.#token(name), opts);
	}

	token(name: string, opts?: ConsumeMethodOpts) {
		this.tokenn(0, name, opts);
	}

	token1(name: string, opts?: ConsumeMethodOpts) {
		this.tokenn(1, name, opts);
	}

	token2(name: string, opts?: ConsumeMethodOpts) {
		this.tokenn(2, name, opts);
	}

	token3(name: string, opts?: ConsumeMethodOpts) {
		this.tokenn(3, name, opts);
	}

	statement = this.RULE('statement', () => {
		this.OR(this.#phrases);
	});

	connect() {
		this.tokenn(255, 'connect');
		this.tokenn(255, 'to');
		this.tokenn(255, 'identifier', { LABEL: 'connect' });
		this.tokenn(255, 'and');
	}

	open() {
		this.tokenn(255, 'open');
		this.tokenn(255, 'identifier', { LABEL: 'open' });
		this.tokenn(255, 'and');
	}

	into() {
		this.tokenn(254, 'and');
		this.tokenn(254, 'output');
		this.tokenn(254, 'into');
		this.tokenn(254, 'identifier', { LABEL: 'into' });
	}

	sendpassn(idx: number, parameter: string) {
		this.or(idx, [
			{ ALT: () => this.tokenn(idx, 'send', { LABEL: `sendpass${idx}` }) },
			{ ALT: () => this.tokenn(idx, 'pass', { LABEL: `sendpass${idx}` }) },
		]);
		this.tokenn(idx, parameter, { LABEL: `sendpass${idx}.parameter` });
		this.tokenn(idx, 'identifier', { LABEL: `sendpass${idx}.identifier` });
		this.tokenn(idx, 'and', { LABEL: `sendpass${idx}.and` });
	}

	sendpass(parameter: string) {
		this.sendpassn(0, parameter);
	}

	sendpass1(parameter: string) {
		this.sendpassn(1, parameter);
	}

	sendpass2(parameter: string) {
		this.sendpassn(2, parameter);
	}
}

export const parse = (parser: Parser, tokens: IToken[]) => {
	parser.input = tokens;
	return {
		cst: parser.statement(),
		errors: parser.errors,
	};
};
