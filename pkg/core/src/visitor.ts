import {
	CstVisitor,
	type StatementCst,
	type PhraseCst,
	type IntoCst,
	type SendpassCst,
	type ConnectCst,
} from '@slangroom/core';
import type { IToken } from '@slangroom/deps/chevrotain';

export type Statement = {
	connect?: string;
	bindings: Map<string, string>;
	phrase: string;
	into?: string;
};

export class ErrorKeyExists extends Error {
	constructor(key: string) {
		super(`key already exists: ${key}`);
		this.name = 'ErrorKeyExists';
	}
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface V {
	visit(cst: StatementCst): ReturnType<this['statement']>;
	visit(cst: PhraseCst): ReturnType<this['phrase']>;
	visit(cst: SendpassCst): ReturnType<this['sendpass']>;
	visit(cst: ConnectCst): ReturnType<this['connect']>;
	visit(cst: IntoCst): ReturnType<this['into']>;
}

class V extends CstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	statement(ctx: StatementCst['children']): Statement {
		const stmt: Statement = {
			phrase: this.visit(ctx.phrase),
			bindings: new Map<string, string>(),
		};
		ctx.sendpass?.forEach((x: SendpassCst) => {
			const [key, value] = this.visit(x);
			if (stmt.bindings.has(key)) throw new ErrorKeyExists(key);
			stmt.bindings.set(key, value);
		});
		if (ctx.connect) stmt.connect = this.visit(ctx.connect);
		if (ctx.into) stmt.into = this.visit(ctx.into);
		return stmt;
	}

	phrase(ctx: PhraseCst['children']): string {
		return ctx.Buzzword.map((x: IToken) => x.image).join(' ');
	}

	sendpass(ctx: SendpassCst['children']): [string, string] {
		return [this.visit(ctx.phrase), ctx.Identifier[0].image.slice(1, -1)];
	}

	connect(ctx: ConnectCst['children']): string {
		return ctx.Identifier[0].image.slice(1, -1);
	}

	into(ctx: IntoCst['children']): string {
		return ctx.Identifier[0].image.slice(1, -1);
	}
}

export const Visitor = new V();

export const visit = (cst: StatementCst): Statement => Visitor.visit(cst);
