import { CstVisitor } from '@slangroom/core/parser';
import type { CstNode } from '@slangroom/deps/chevrotain';

export enum ActionType {
	Read,
	Save,
}

export type Statement = {
	connect?: string,
	bindings: Map<string, string>,
	buzzwords: string,
	into?: string,
}

export class StatementBindings {
	#bindings: Map<string, string>;
	constructor() {
		this.#bindings = new Map<string, string>();
	}

	get(key: string) {
		return this.#bindings.get(key)
	}
	set(key: string, val: string) {
		if(this.#bindings.has(key)) {
			throw new Error("Duplicate key")
		}
		this.#bindings.set(key, val)

	}
}

export const Visitor = new (class extends CstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}
	statement(ctx: any) {
		const node: Statement = {
			buzzwords: this.visit(ctx.buzzwords),
			bindings: new Map<string, string>(
				ctx.sendpass?.map((v: any) => this.visit(v))),
		}
		if(ctx.connect) {
			node.connect = this.visit(ctx.connect)
		}
		if(ctx.into) {
			node.into = this.visit(ctx.into)
		}
		return node
	}
	connect(ctx: any) {
		return ctx.Identifier[0].image.slice(1,-1)
	}
	sendpass(ctx: any) {
		const identifier = ctx.Identifier[0].image.slice(1,-1)
		return [this.visit(ctx.buzzwords), identifier]
	}
	into(ctx: any) {
		return ctx.Identifier[0].image.slice(1,-1)
	}
	buzzwords(ctx: any) {
		return ctx.Buzzword.map((v: any) => v.image).join(' ');
	}

})();

export const visit = (cst: CstNode): Statement => Visitor.visit(cst);
