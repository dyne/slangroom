import { createToken, Lexer, CstParser } from "@slangroom/deps/chevrotain";
//import { createSyntaxDiagramsCode } from "chevrotain";
import { JsonableObject, Jsonable } from "@slangroom/shared";

type Action = {
  clause: string,
  args: string[]
}

type IntoStmt = {
  kind: "Into";
  read: Action;
  result: string
};
type AndStmt = {
  kind: "And";
  read?: Action;
  save?: Action;
};
type Stmt =
  | IntoStmt
  | AndStmt;


const stmtJoin = (s1: Stmt, s2: Stmt): AndStmt => {
  if(s1.kind != "And" || s2.kind != "And") {
    throw new Error("Can only join And statements");
  }
  const s3: AndStmt = s1
  if (s2.read) {
    s3.read = s2.read;
  }
  if (s2.save) {
    s1.save = s2.save;
  }
  return s3;
}
// A plugin will be (VERB, ACTION)
const Save = createToken({
  name: "Save",
  pattern: /save/i,
});
const Read = createToken({
  name: "Read",
  pattern: /read/i,
});

// Top level keywords
const And = createToken({
  name: "And",
  pattern: /and/i,
});
const Into = createToken({
  name: "Into",
  pattern: /into/i,
});



// Actions
const Keyword = createToken({
  name: "Keyword",
  pattern: /[a-z]+/i,
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
  Read,
  Save,
  Into,
  And,
  Identifier,
  Keyword,
];
const StatementLexer = new Lexer(allTokens);
// ----------------- parser -----------------
class StatementParser extends CstParser {
  constructor() {
    super(allTokens);

    this.performSelfAnalysis();
  }

  public readClause = this.RULE("readClause", () => {
    this.CONSUME(Read);
    this.SUBRULE(this.customs)
    this.OR2([
        { ALT: () => {
        this.CONSUME(Into);
        this.CONSUME(Identifier);
        } },
        { ALT: () => {
        this.CONSUME(And);
        this.SUBRULE(this.statement);
        } },
        { ALT: () => { } },
    ]);
  });
  public saveClause = this.RULE("saveClause", () => {
    this.CONSUME(Save);
    this.SUBRULE(this.customs)
    this.OR2([
        { ALT: () => {
        this.CONSUME(And);
        this.SUBRULE(this.statement);
        } },
        { ALT: () => { } },
    ]);
  });
  public statement = this.RULE("statement", () => {
    this.OR([{ ALT: () => { this.SUBRULE(this.readClause); }},
             { ALT: () => { this.SUBRULE(this.saveClause); }},
    ]);
  });


  // We will replace this with actions
  // Restroom-like match
  public customs = this.RULE("customs", () => {
    this.MANY(() => {
      this.SUBRULE(this.custom)
    })
  });

  public custom = this.RULE("custom", () => {
    this.OR([
      {ALT:()=>{
        this.CONSUME(Identifier)
      }},
      {ALT:()=>{
        this.CONSUME(Keyword)
      }},
    ])
  });

}

// wrapping it all together
// reuse the same parser instance.
const parser = new StatementParser();
// ----------------- Interpreter -----------------
// Obtains the default CstVisitor constructor to extend.
const BaseCstVisitor = parser.getBaseCstVisitorConstructor();
// All our semantics go into the visitor, completly separated from the grammar.

const normalizeStatement = (stmt: string) => {
  return stmt.replaceAll(/'[^']*'/gi, "''")
}

const getArgs = (stmt: string) => {
    return stmt.match(/'([^']+)'/g)?.map(match => match.slice(1, -1)) || [];
}

class StatementInterpreter extends BaseCstVisitor {

  constructor() {
    super();
    this.validateVisitor();
  }

  statement(ctx: any) {
    let res: Stmt = {
      kind: "And",
    }
    if(ctx.readClause) {
      res = this.visit(ctx.readClause)
    } else if(ctx.saveClause) {
      res = this.visit(ctx.saveClause)
    }

    return res
  }

  readClause(ctx: any) {
    const action = this.visit(ctx.customs)
    if(ctx.Into) {
      // simple statement just read and write to a variable
      return {
        kind: "Into",
        read: action,
        result: ctx.Identifier[0].image.slice(1,-1),
      }
    }
    let res: AndStmt =  {
      kind: "And",
      read: action
    }
    if(ctx.statement) {
      const other = this.visit(ctx.statement)
      res = stmtJoin(res, other)
    }
    return res
  }

  saveClause(ctx: any) {
    const action = this.visit(ctx.customs)
    let res: AndStmt =  {
      kind: "And",
      save: action
    }
    if(ctx.statement) {
      res = stmtJoin(res, this.visit(ctx.statement))
    }
    return res
  }

  customs(ctx: any) {
    const action = ctx.custom.map((v: any[]) => this.visit(v)).join(' ')
    const normalized = normalizeStatement(action)
    const args = getArgs(action)
    return {
      clause: normalized,
      args
    }
  }

  custom(ctx: any) {
    return (ctx.Keyword || ctx.Identifier)[0].image
  }


}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new StatementInterpreter();

export const line2AST = (text: string) => {
  // 1. Tokenize the input.
  const lexResult = StatementLexer.tokenize(text);
  //console.log(lexResult)

  // 2. Parse the Tokens vector.
  parser.input = lexResult.tokens;
  const cst = parser.statement();

  // 3. Perform semantics using a CstVisitor.
  // Note that separation of concerns between the syntactic analysis (parsing) and the semantics.
  const value = interpreter.visit(cst);

  return {
    value: value,
    lexResult: lexResult,
    parseErrors: parser.errors,
  };
}

type StmtContext = {
	data: JsonableObject,
	context: any,
}

type ReadHandler = (keys: JsonableObject, ctx: StmtContext,
	                args: string[]) => Jsonable
type ReadHandlers = Record<string, ReadHandler>
type SaveHandler = (keys: JsonableObject, ctx: StmtContext,
                    args: string[]) => void
type SaveHandlers = Record<string, SaveHandler>

export class SlangroomContext {
	private reads: ReadHandlers = {}
	private saves: SaveHandlers = {}

	addRead(stmt: string, handler: ReadHandler) {
		// TODO: check that it doesn't exists
		this.reads[stmt] = handler;
	}

	addSave(stmt: string, handler: SaveHandler) {
		// TODO: check that it doesn't exists
		this.saves[stmt] = handler;
	}

	getRead(stmt: string): ReadHandler {
		const read = this.reads[stmt]
		if(!read) {
			throw new Error("Unknown read statement")
		}
		return read;
	}

	getSave(stmt: string) {
		const save = this.saves[stmt]
		if(!save) {
			throw new Error("Unknown read statement")
		}
		return save;
	}
}

export const saveToConsole: SaveHandler = (_, ctx, []) => {
	console.log(ctx.context.raw || "Unknown var")
}

export const readTimestamp: ReadHandler = (_, _ctx, []): Jsonable => {
	return Math.round(Date.now() / 1000);
}

export const evaluate = (ctx: SlangroomContext, value: Stmt,
		keys: JsonableObject, stmtCtx: StmtContext) => {
	if (value.kind === "Into") {
		stmtCtx.context.raw = ctx.getRead(value.read.clause)
				(keys, stmtCtx, value.read.args)
		stmtCtx.data[value.result] = stmtCtx.context.raw
	} else if (value.kind === "And") {
		if(value.read) {
			stmtCtx.context.raw = ctx.getRead(value.read.clause)
					(keys, stmtCtx, value.read.args)
		}
		if (value.save) {
			console.log(ctx.getSave(value.save.clause))
			ctx.getSave(value.save.clause)
					(keys, stmtCtx, value.save.args)

		}
	}
	return stmtCtx
}
