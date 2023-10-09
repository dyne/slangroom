import { createToken, Lexer, CstParser } from "@slangroom/deps/chevrotain";
import { JsonableArray, Jsonable } from "@slangroom/shared";
import {
	Plugin,
	EvaluationResult,
	EvaluationResultKind,
} from "@slangroom/core/plugin";
import { Whitespace } from "@slangroom/shared/tokens"
import axios from "axios";
import { createSyntaxDiagramsCode } from "@slangroom/deps/chevrotain";
import fs from 'node:fs'

// AST
export enum RequestMethod {
	Get,
	Post
}

export enum RequestKind {
	Default,
	Parallel,
	Sequential,
	Same,
}


type RequestAST = {
	method: RequestMethod
	kind: RequestKind
}


const Get = createToken({
	name: "Get",
	pattern: /get/i,
});
const Post = createToken({
	name: "Post",
	pattern: /post/i,
});
const Do = createToken({
	name: "Do",
	pattern: /do/i,
});
const Parallel = createToken({
	name: "Parallel",
	pattern: /parallel/i
});
const Same = createToken({
	name: "Same",
	pattern: /same/i,
});
const Sequential = createToken({
	name: "Sequential",
	pattern: /sequential/i,
});

const allTokens = [
	Whitespace,
	Get,
	Post,
	Parallel,
	Sequential,
	Same,
	Do,
];
const StatementLexer = new Lexer(allTokens);
// ----------------- parser -----------------
class StatementParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

	public method = this.RULE("method", () => {
		this.OR([
			{ ALT: () => this.CONSUME(Get) },
			{ ALT: () => this.CONSUME(Post) },
		]);
	})

	public kind = this.RULE("kind", () => {
		this.OR([
			{ ALT: () => this.CONSUME(Sequential) },
			{ ALT: () => this.CONSUME(Parallel) },
			{ ALT: () => this.CONSUME(Same) },
		]);
	})

	public statement = this.RULE("statement", () => {
		this.CONSUME(Do)
		this.OPTION(() => this.SUBRULE(this.kind))
		this.SUBRULE(this.method)
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
	statement(ctx: any): RequestAST {
		return {
			method: this.visit(ctx.method),
			kind: ctx.kind ? this.visit(ctx.kind) : RequestKind.Default
		}
	}
	kind(ctx: any): RequestKind {
		if(ctx.Sequential) {
			return RequestKind.Sequential
		}
		if(ctx.Parallel) {
			return RequestKind.Parallel
		}
		if(ctx.Same) {
			return RequestKind.Same
		}
		throw new Error("Should not be here: unknown request kind")
	}

	method(ctx: any): RequestMethod {
		if(ctx.Post) {
			return RequestMethod.Post
		}
		if(ctx.Get) {
			return RequestMethod.Get
		}
		throw new Error("Should not be here: unknown request method")
	}
}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new StatementInterpreter();

export const astify = (text: string) => {
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

export const evaluate = async (ast: RequestAST,
		args: Map<string, Jsonable>): Promise<EvaluationResult> => {
	if(ast.kind == RequestKind.Default) {
		let error: any = null;
		const r = await axios.request({
			headers: {'Content-Type': 'application/json'},
			method: ast.method == RequestMethod.Get ? "get" : "post",
			url: ((args.get("connect") as string) || ""),
			data: JSON.stringify(args.get("object")),
			validateStatus: () => true
		}).catch((e) => error = e);
		const zenResult = error
			? { status: error.code, error: "" }
        	: { status: r.status, result: r.data || "" }
        return {
			kind: EvaluationResultKind.Success,
			result: zenResult,
		};
	} else {
		// TODO: check type of urls, body, ... all data from zenroom
		let dataFz = (_i: number) => {_i; return args.get("object"); }
		if(ast.kind == RequestKind.Parallel || ast.kind == RequestKind.Sequential) {
			dataFz = (i: number) => (args.get("object") as JsonableArray)[i]
		}
		const urls = args.get("connect") as string[]
		const reqs_promises = []

		if(ast.kind == RequestKind.Sequential) {
			throw new Error("Not yet implemented")
		} else {
			for(let i = 0; i < urls.length; i++) {
				reqs_promises.push(axios.request({
					method: ast.method == RequestMethod.Get ? "get" : "post",
					url: urls[i] || "",
					data: dataFz(i),
					validateStatus: () => true,
				}))
			}
			const results: JsonableArray = new Array(reqs_promises.length)
			const errors: { [key: number]: any} = {};
			const parallel_with_catch = reqs_promises.map((v, i) => v.catch(
			  (e) => errors[i] = e
			))
			const parallel_results = await axios.all(parallel_with_catch)
			parallel_results.map((r, i) => {

				const zenResult = errors[i]
				  ? { "status": errors[i].code, "result": "" }
				  : { "status": r.status, "result": r.data || ""}
				results[i] = zenResult;
			});
			return {
				kind: EvaluationResultKind.Success,
				result: results,
			};
		}
	}
}


const serializedGrammar = parser.getSerializedGastProductions();

// create the HTML Text
const htmlText = createSyntaxDiagramsCode(serializedGrammar);

// Write the HTML file to disk
fs.writeFileSync("./generated_diagrams_http.html", htmlText);

class HttpPlugin extends Plugin {
	evaluate(phrase: string): Promise<EvaluationResult> | EvaluationResult {
		const ast = astify(phrase)
		const paramsSpec: Map<string, boolean> = new Map()
		if(ast.parseErrors.length > 0) {
			return {
				kind: EvaluationResultKind.Failure,
				error: ast.parseErrors
			}
		}

		paramsSpec.set("connect", true)
		if(ast.value.kind == RequestKind.Parallel ||
				ast.value.kind == RequestKind.Sequential) {
			paramsSpec.set("object", true)
		} else {
			paramsSpec.set("object", false)
		}

		const args = this.buildParams(paramsSpec)

		return evaluate(ast.value, args)
	}
}

export default new HttpPlugin();
