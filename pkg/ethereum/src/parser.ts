import {
	CstParser,
	type CstNode,
	type IToken,
	createSyntaxDiagramsCode,
} from '@slangroom/deps/chevrotain';
import {
	allTokens,
	Read,
	The,
	Ethereum,
	Nonce,
	Bytes,
	Balance,
	Transaction,
	Id,
	After,
	Broadcast,
	Suggested,
	Gas,
	Price,
	Erc20,
	Decimals,
	Name,
	Symbol_,
	Total,
	Supply,
	Erc721,
	In,
	Owner,
	Asset,
} from '@slangroom/ethereum';
import * as fs from 'node:fs';

export type PhraseCst = CstNode & {
	children: {
		ethereum: EthereumCst;
		erc20: Erc20Cst;
		erc721: Erc721Cst;
	};
};

export type EthereumCst = CstNode & {
	children:
		| { Nonce: [IToken] }
		| { Bytes: [IToken] }
		| { Balance: [IToken] }
		| { broadcast: CstNode }
		| { gasPrice: CstNode };
};

export type Erc20Cst = CstNode & {
	children:
		| { Decimals: [IToken] }
		| { Name: [IToken] }
		| { Symbol: [IToken] }
		| { Balance: [IToken] }
		| { totalSupply: CstNode };
};

export type Erc721Cst = CstNode & {
	children: { id: CstNode } | { Asset: [IToken] } | { Owner: [IToken] };
};

export type KindCst = CstNode & {
	children: { Sequential: [IToken] } | { Parallel: [IToken] } | { Same: [IToken] };
};

export type MethodCst = CstNode & {
	children: { Get: [IToken] } | { Post: [IToken] };
};

const Parser = new (class extends CstParser {
	constructor() {
		super(allTokens);
		this.performSelfAnalysis();
	}

	phrase = this.RULE('phrase', () => {
		this.CONSUME(Read);
		this.CONSUME(The);
		this.OR([
			{ ALT: () => this.SUBRULE(this.#ethereum) },
			{ ALT: () => this.SUBRULE(this.#erc20) },
			{ ALT: () => this.SUBRULE(this.#erc721) },
		]);
	});

	#ethereum = this.RULE('ethereum', () => {
		this.CONSUME(Ethereum);
		this.OR([
			{ ALT: () => this.CONSUME(Nonce) },
			{ ALT: () => this.CONSUME(Bytes) },
			{ ALT: () => this.CONSUME(Balance) },
			{ ALT: () => this.SUBRULE(this.#broadcast) },
			{ ALT: () => this.SUBRULE(this.#gasPrice) },
		]);
	});

	#broadcast = this.RULE('broadcast', () => {
		this.CONSUME(Transaction);
		this.CONSUME(Id);
		this.CONSUME(After);
		this.CONSUME(Broadcast);
	});

	#gasPrice = this.RULE('gasPrice', () => {
		this.CONSUME(Suggested);
		this.CONSUME(Gas);
		this.CONSUME(Price);
	});

	#erc20 = this.RULE('erc20', () => {
		this.CONSUME(Erc20);
		this.OR([
			{ ALT: () => this.CONSUME(Decimals) },
			{ ALT: () => this.CONSUME(Name) },
			{ ALT: () => this.CONSUME(Symbol_) },
			{ ALT: () => this.CONSUME(Balance) },
			{ ALT: () => this.SUBRULE(this.#totalSupply) },
		]);
	});

	#totalSupply = this.RULE('totalSupply', () => {
		this.CONSUME(Total);
		this.CONSUME(Supply);
	});

	#erc721 = this.RULE('erc721', () => {
		this.CONSUME(Erc721);
		this.OR([
			{ ALT: () => this.SUBRULE(this.#id) },
			{ ALT: () => this.CONSUME(Owner) },
			{ ALT: () => this.CONSUME(Asset) },
		]);
	});

	#id = this.RULE('id', () => {
		this.CONSUME(Id);
		this.CONSUME(In);
		this.CONSUME(Transaction);
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

// TODO: remove
const serializedGrammar = Parser.getSerializedGastProductions();
const htmlText = createSyntaxDiagramsCode(serializedGrammar);
fs.writeFileSync('./generated_diagrams_eth.html', htmlText);
