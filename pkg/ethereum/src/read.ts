import { createToken, Lexer, CstParser } from "@slangroom/deps/chevrotain";
//import { JsonableObject, Jsonable, JsonableArray } from "@slangroom/shared";
//import { StmtContext } from "@slangroom/core/slangroom";
import { Whitespace, Identifier } from "@slangroom/shared/tokens"
import { createSyntaxDiagramsCode } from "@slangroom/deps/chevrotain";
import fs from 'node:fs'

export enum EthereumRequestKind {
	EthereumNonce,
	EthereumGasPrice,
	EthereumBytes,
	EthereumBalance,
	EthereumBroadcast,
	Erc20Method,
	Erc721Id,
	Erc721Owner,
	Erc721Asset,
}

type EthereumRequestWithAddress = {
	kind: EthereumRequestKind.EthereumNonce | EthereumRequestKind.EthereumBalance,
	address: string,
}

type EthereumRequestWithTransactionId = {
	kind: EthereumRequestKind.EthereumBytes | EthereumRequestKind.Erc721Id,
	transactionId: string,
}

type EthereumRequestWithRawTransaction = {
	kind: EthereumRequestKind.EthereumBroadcast,
	rawTransaction: string,
}

type EthereumRequestWithoutArgs = {
	kind: EthereumRequestKind.EthereumGasPrice,
}

type Erc20RequestWithoutArg = {
	kind: EthereumRequestKind.Erc20Method,
	address: string,
}
type Erc20RequestWithArg = {
	kind: EthereumRequestKind.Erc20Method,
	arg: string,
	address: string,
}
type Erc721RequestWithArgs = {
	kind: EthereumRequestKind.Erc721Owner | EthereumRequestKind.Erc721Asset,
	nftId: string,
	address: string,
}

type EthereumRequestAST =
	EthereumRequestWithAddress
	| EthereumRequestWithTransactionId
	| EthereumRequestWithoutArgs
	| EthereumRequestWithRawTransaction
	| Erc20RequestWithArg
	| Erc20RequestWithoutArg
	| Erc721RequestWithArgs




const Ethereum = createToken({
	name: "Ethereum",
	pattern: /ethereum/i,
});
const Nonce = createToken({
	name: "Nonce",
	pattern: /nonce/i,
});
const Suggested = createToken({
	name: "Suggested",
	pattern: /suggested/i,
});
const GasPrice = createToken({
	name: "GasPrice",
	pattern: /gas price/i,
});
const For = createToken({
	name: "For",
	pattern: /for/i
});
const With = createToken({
	name: "With",
	pattern: /with/i,
	group: Lexer.SKIPPED,
});
const In = createToken({
	name: "In",
	pattern: /in/i,
});
const Of = createToken({
	name: "Of",
	pattern: /of/i
});
const Bytes = createToken({
	name: "Bytes",
	pattern: /bytes/i,
});
const Hash = createToken({
	name: "Hash",
	pattern: /hash/i,
});
const Balance = createToken({
	name: "Balance",
	pattern: /balance/i,
});
const Array = createToken({
	name: "Array",
	pattern: /array/i,
});
const From = createToken({
	name: "From",
	pattern: /from/i,
});
const Erc20 = createToken({
	name: "Erc20",
	pattern: /erc20/i,
});
const Erc721 = createToken({
	name: "Erc721",
	pattern: /erc721/i,
});
const Transaction = createToken({
	name: "Transaction",
	pattern: /transaction/i,
});
const TransactionId = createToken({
	name: "TransactionId",
	pattern: /transaction id/i,
});
const NftId = createToken({
	name: "NftId",
	pattern: /nft id/i,
});
const After = createToken({
	name: "After",
	pattern: /after/i,
});
const Broadcast = createToken({
	name: "Broadcast",
	pattern: /broadcast/i,
});
const The = createToken({
	name: "The",
	pattern: /the/i,
	group: Lexer.SKIPPED,
});
const Owner = createToken({
	name: "Owner",
	pattern: /owner/i,
});
const Id = createToken({
	name: "Id",
	pattern: /id/i,
});
const Asset = createToken({
	name: "Asset",
	pattern: /asset/i,
});

const allTokens = [
	Whitespace,
	The,
	Ethereum,
	Nonce,
	Suggested,
	GasPrice,
	For,
	With,
	In,
	Of,
	Bytes,
	Hash,
	Balance,
	Array,
	From,
	Erc20,
	Erc721,
	TransactionId,
	Transaction,
	NftId,
	After,
	Broadcast,
	Asset,
	Owner,
	Id,
	Identifier,
];
const StatementLexer = new Lexer(allTokens);
// ----------------- parser -----------------
class StatementParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

	public ethereum = this.RULE("ethereum", () => {
		this.CONSUME(Ethereum)
		this.OR1([
			{ ALT: () => {
				this.OR2([
					{ ALT: () => {
						this.CONSUME(Nonce);
						this.CONSUME(For);
					}},
					{ ALT: () => {
						this.CONSUME(Bytes);
						this.CONSUME(Hash);
					}},
					{ ALT: () => {
						this.CONSUME(Balance);
						this.CONSUME2(For);
						this.OPTION(() => {
							this.CONSUME(Array)
						})
					}},
					{ ALT: () => {
						this.CONSUME(TransactionId);
						this.CONSUME(After);
						this.CONSUME(Broadcast);
						this.CONSUME(Of);
					}},
				]);
				this.CONSUME(Identifier);
			}},
			{ ALT: () => {
				this.CONSUME(Suggested);
				this.CONSUME(GasPrice);
			}},
		])

	})

	public erc20 = this.RULE("erc20", () => {
		this.CONSUME(Erc20)
		this.CONSUME1(Identifier, {LABEL: "method"})
		this.OPTION(() => {
			this.CONSUME(Of);
			this.CONSUME2(Identifier, {LABEL: "arg"});
		})
		this.CONSUME(For)
		this.CONSUME3(Identifier, {LABEL: "address"})
	})

	public erc721 = this.RULE("erc721", () => {
		this.CONSUME(Erc721)
		this.OR([
			{ ALT: () => {
				this.CONSUME(Id);
				this.CONSUME(In);
				this.CONSUME(Transaction);
			}},
			{ ALT: () => {
				this.CONSUME(Owner);
				this.CONSUME(Of);
				this.CONSUME1(Identifier, {LABEL: "nftId"});
				this.CONSUME(For);
			}},
			{ ALT: () => {
				this.CONSUME(Asset);
				this.CONSUME2(In);
				this.CONSUME2(Identifier, {LABEL: "nftId"});
				this.CONSUME2(For);
			}}
		]);
		this.CONSUME3(Identifier, {LABEL: "addresOrTxId"});
	})

	public statement = this.RULE("statement", () => {
		this.OR([
			{ ALT: () => this.SUBRULE(this.ethereum) },
			{ ALT: () => this.SUBRULE(this.erc20) },
			{ ALT: () => this.SUBRULE(this.erc721) },
		])
	});
}

const parser = new StatementParser();
// ----------------- Interpreter -----------------
const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

class StatementInterpreter extends BaseCstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}
	statement(ctx: any) {
		return this.visit(ctx.ethereum || ctx.erc20 || ctx.erc721);
	}
	ethereum(ctx: any): EthereumRequestAST {
		if(ctx.Nonce || ctx.Balance) {
			return {
				kind: ctx.Nonce ? EthereumRequestKind.EthereumNonce : EthereumRequestKind.EthereumBalance,
				address: ctx.Identifier[0].image.slice(1,-1),
			}
		} else if(ctx.GasPrice) {
			return {
				kind: EthereumRequestKind.EthereumGasPrice
			}
		} else if(ctx.Broadcast) {
			return {
				kind: EthereumRequestKind.EthereumBroadcast,
				rawTransaction: ctx.Identifier[0].image.slice(1,-1),
			}
		} else if(ctx.Bytes) {
			return {
				kind: EthereumRequestKind.EthereumBytes,
				transactionId: ctx.Identifier[0].image.slice(1,-1),
			}
		}
		throw new Error("Should not be here!!")
	}
	erc20(ctx: any): EthereumRequestAST {
		if(ctx.arg) {
			return {
				kind: EthereumRequestKind.Erc20Method,
				arg: ctx.arg[0].image.slice(1,-1),
				address: ctx.address[0].image.slice(1,-1),
			}
		} else {
			return {
				kind: EthereumRequestKind.Erc20Method,
				address: ctx.address[0].image.slice(1,-1),
			}
		}
	}
	erc721(ctx: any): EthereumRequestAST {
		if(ctx.Asset) {
			return {
				kind: EthereumRequestKind.Erc721Asset,
				nftId: ctx.nftId[0].image.slice(1,-1),
				address: ctx.addresOrTxId[0].image.slice(1,-1)
			}
		} else if(ctx.Owner) {
			return {
				kind: EthereumRequestKind.Erc721Owner,
				nftId: ctx.nftId[0].image.slice(1,-1),
				address: ctx.addresOrTxId[0].image.slice(1,-1)
			}
		} else if(ctx.Id) {
			return {
				kind: EthereumRequestKind.Erc721Id,
				transactionId: ctx.addresOrTxId[0].image.slice(1,-1),
			}
		}
		throw new Error("Should not be here!!")
	}
}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new StatementInterpreter();


export const line2Ast = (text: string) => {
	const lexResult = StatementLexer.tokenize(text);
	parser.input = lexResult.tokens;
	const cst = parser.statement();
	const value = interpreter.visit(cst);
	return {
		value: value,
		lexResult: lexResult,
		parseErrors: parser.errors,
	};
}

const serializedGrammar = parser.getSerializedGastProductions();

// create the HTML Text
const htmlText = createSyntaxDiagramsCode(serializedGrammar);

// Write the HTML file to disk
fs.writeFileSync("./generated_diagrams_eth.html", htmlText);
