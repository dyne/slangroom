import { createToken, Lexer, CstParser } from "@slangroom/deps/chevrotain";
//import { createSyntaxDiagramsCode } from "chevrotain";
import { JsonableObject, Jsonable, JsonableArray } from "@slangroom/shared";
import { StmtContext } from "@slangroom/core/slangroom";
import axios from "axios";

export enum Method {
	GET,
	POST
}

export enum DefaultBodyKind {
	KEYS,
	DATA,
	ALL
}
type DefaultBody = {
	kind: "Default",
	body: DefaultBodyKind,
}

type CustomBody = {
	kind: "Custom",
	identifier: string
}
type Body = DefaultBody | CustomBody

type SingleReceiver = {
	kind: "Endpoint",
	name: string
}

type MultiReceiver = {
	kind: "Endpoints",
	name: string,
	differentData: boolean,
}

type Receiver = SingleReceiver | MultiReceiver

type RequestAST = {
	method: Method
	receiver: Receiver
	body?: Body
}


const Get = createToken({
	name: "Get",
	pattern: /get/i,
});
const Post = createToken({
	name: "Post",
	pattern: /post/i,
});
const Endpoints = createToken({
	name: "Endpoints",
	pattern: /endpoints/i,
});
const Endpoint = createToken({
	name: "Endpoint",
	pattern: /endpoint/i
});
const Passing = createToken({
	name: "Passing",
	pattern: /passing/i,
});
const Data = createToken({
	name: "Data",
	pattern: /data/i,
});
const Keys = createToken({
	name: "Keys",
	pattern: /keys/i,
});
const All = createToken({
	name: "All",
	pattern: /all/i,
});
const Different = createToken({
	name: "Different",
	pattern: /different/i,
});

const Identifier = createToken({
	name: "Identifier",
	pattern: /'[a-z]+'/i,
});


const WhiteSpace = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
});

const allTokens = [
	WhiteSpace,
	Get,
	Post,
	Endpoints,
	Endpoint,
	Passing,
	Data,
	Keys,
	All,
	Different,
	Identifier
];
const StatementLexer = new Lexer(allTokens);
// ----------------- parser -----------------
class StatementParser extends CstParser {
	constructor() {
		super(allTokens);

		this.performSelfAnalysis();
	}

	// TODO: remove code duplicatio using RULE ARGS and GATEs

	public endpoint = this.RULE("endpoint", () => {
		this.OR1([
			{ ALT: () => this.CONSUME(Get) },
			{ ALT: () => this.CONSUME(Post) },
		]);
		this.CONSUME(Endpoint);
		this.CONSUME(Identifier, {LABEL: "name"});
		this.OPTION(() => {
			this.CONSUME(Passing)
			this.OR2([
				{ ALT: () => this.CONSUME(Data) },
				{ ALT: () => this.CONSUME(Keys) },
				{ ALT: () => this.CONSUME(All) },
				{
					ALT: () => {
						this.CONSUME2(Identifier, {LABEL: "dataFrom"})
					}
				},
			])
		});
	})

	public endpoints = this.RULE("endpoints", () => {
		this.OR1([
			{ ALT: () => this.CONSUME(Get) },
			{ ALT: () => this.CONSUME(Post) },
		]);
		this.CONSUME(Endpoints);
		this.CONSUME(Identifier, {LABEL: "name"});
		this.OPTION(() => {
			this.CONSUME(Passing)
			this.OR2([
				{ ALT: () => this.CONSUME(Data) },
				{ ALT: () => this.CONSUME(Keys) },
				{ ALT: () => this.CONSUME(All) },
				{
					ALT: () => {
						this.OPTION2(() => this.CONSUME(Different))
						this.CONSUME2(Identifier, {LABEL: "dataFrom"})
					}
				},
			])
		});
	})

	public statement = this.RULE("statement", () => {
		this.OR([
			{ ALT: () => this.SUBRULE(this.endpoint) },
			{ ALT: () => this.SUBRULE(this.endpoints) },
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
		return this.visit(ctx.endpoint || ctx.endpoints)
	}

	endpoint(ctx: any): RequestAST {
		const method = ctx.Get ? Method.GET : Method.POST
		const receiver: SingleReceiver = {kind: "Endpoint", name: ctx.name[0].image.slice(1,-1)}
		const body: Body | undefined =
			ctx.Data ? {kind: "Default", body: DefaultBodyKind.DATA}
		    : ctx.Keys ? {kind: "Default", body: DefaultBodyKind.KEYS}
			: ctx.All ? {kind: "Default", body: DefaultBodyKind.ALL}
			: ctx.dataFrom ? {kind: "Custom", identifier: ctx.dataFrom[0].image.slice(1,-1)}
			: undefined
		const endpoint: RequestAST = {
			method,
			receiver
		}
		if(body) endpoint.body = body
		return endpoint
	}
	endpoints(ctx: any) {
		const method = ctx.Get ? Method.GET : Method.POST
		const receiver: MultiReceiver = {kind: "Endpoints", name: ctx.name[0].image.slice(1,-1), differentData: !!ctx.Different}
		const body: Body | undefined =
			ctx.Data ? {kind: "Default", body: DefaultBodyKind.DATA}
		    : ctx.Keys ? {kind: "Default", body: DefaultBodyKind.KEYS}
			: ctx.All ? {kind: "Default", body: DefaultBodyKind.ALL}
			: ctx.dataFrom ? {kind: "Custom", identifier: ctx.dataFrom[0].image.slice(1,-1)}
			: undefined
		const endpoint: RequestAST = {
			method,
			receiver
		}
		if(body) endpoint.body = body
		return endpoint
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

export const evaluate = async (ast: RequestAST,
		keys: JsonableObject, stmtCtx: StmtContext): Promise<JsonableObject | JsonableArray> => {
	let body: Jsonable | undefined
	if(ast.body) {
		if(ast.body.kind == "Default") {
			switch(ast.body.body) {
				case DefaultBodyKind.KEYS: body = keys; break;
				case DefaultBodyKind.DATA: body = stmtCtx.data; break;
				case DefaultBodyKind.ALL: body = {...stmtCtx.data, ...keys}; break;
			}
		} else {
			body = stmtCtx.data[ast.body.identifier] || keys[ast.body.identifier]
		}
	}
	if(ast.receiver.kind == "Endpoint") {
		let error: any = null;
		const r = await axios.request({
			method: ast.method == Method.GET ? "get" : "post",
			url: (stmtCtx.data[ast.receiver.name] || keys[ast.receiver.name] || ast.receiver.name).toString(),
			data: body,
			validateStatus: () => true
		}).catch((e) => error = e);
		const zenResult = error
			? { status: error.code, error: "" }
        	: { status: r.status, result: r.data || "" }
        return zenResult;
	} else {
		// TODO: check type of urls, body, ... all data from zenroom
		let dataFz = (_i: number) => body;
		if(ast.receiver.differentData) {
			dataFz = (i: number) => (body as JsonableArray)[i]
		}
		const urls = (stmtCtx.data[ast.receiver.name] || keys[ast.receiver.name]) as string[]
		let reqs_promises = []


		for(let i = 0; i < urls.length; i++) {
			reqs_promises.push(axios.request({
				method: ast.method == Method.GET ? "get" : "post",
				url: urls[i] || "",
				data: dataFz(i),
				validateStatus: () => true
			}))
		}
		let results: JsonableArray = new Array(reqs_promises.length)
		let errors: { [key: number]: any} = {};
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
		return results;
	}
}
