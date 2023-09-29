import { createToken, Lexer, CstParser } from "@slangroom/deps/chevrotain";
import { JsonableObject } from "@slangroom/shared";
import { StmtContext } from "@slangroom/core/slangroom";
import { Whitespace, Identifier } from "@slangroom/shared/tokens"
import { Web3 } from 'web3'

type EthereumConnect = {
	address: string
}

const Ethereum = createToken({
	name: "Ethereum",
	pattern: /ethereum/i,
});
const The = createToken({
	name: "The",
	pattern: /the/i,
	group: Lexer.SKIPPED,
});
const Provider = createToken({
	name: "Provider",
	pattern: /Provider/i,
});
const To = createToken({
	name: "To",
	pattern: /To/i,
});

const allTokens = [
	Whitespace,
	The,
	To,
	Ethereum,
	Provider,
	Identifier,
];
const StatementLexer = new Lexer(allTokens);
// ----------------- parser -----------------
class StatementParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

	public statement = this.RULE("statement", () => {
		this.CONSUME(To);
		this.CONSUME(Ethereum);
		this.CONSUME(Provider);
		this.CONSUME(Identifier);
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
		return {address: ctx.Identifier[0].image.slice(1,-1)}
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

type EthereumConnectResult = {
	name: string,
	value: Web3
}

export const evaluate = async (ast: EthereumConnect,
                keys: JsonableObject, stmtCtx: StmtContext): Promise<EthereumConnectResult> => {
	const address = (keys[ast.address] || stmtCtx.data[ast.address] || ast.address) as string
	return {
		name: "web3",
		value: new Web3(address)
	}
}
