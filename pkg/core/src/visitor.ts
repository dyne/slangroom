import { CstVisitor } from '@slangroom/core/parser';
import type { CstNode } from '@slangroom/deps/chevrotain';

export enum ActionType {
	Read,
	Save,
}

export type Read = {
	kind: ActionType.Read,
	buzzwords: string,
	into: string[],
}

export type Save = {
	kind: ActionType.Save,
	buzzwords: string,
}

export type Action = Read | Save

export type Statement = {
	connect?: string,
	bindings: Map<string, string>,
	action: Action
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
	statements(ctx: any) {
		return ctx.statement.map((v: any) => this.visit(v))
	}
	statement(ctx: any) {
		const node: Statement = {
			action: this.visit(ctx.readsave),
			bindings: new Map<string, string>(
				ctx.sendpass?.map((v: any) => this.visit(v))),
		}
		if(ctx.connect) {
			node.connect = this.visit(ctx.connect)
		}
		return node
	}
	connect(ctx: any) {
		return ctx.Identifier[0].image.slice(1,-1)
	}
	sendpass(ctx: any) {
		const identifier = ctx.Identifier[0].image.slice(1,-1)
		if(ctx.buzzwords) {
			return [this.visit(ctx.buzzwords), identifier]
		}
		return [identifier, identifier]
	}
	readsave(ctx: any) {
		return this.visit(ctx.read || ctx.save)
	}
	save(ctx: any) {
		return {
			kind: ActionType.Save,
			phrase: this.visit(ctx.buzzwords)
		}
	}
	read(ctx: any) {
		return {
			kind: ActionType.Read,
			phrase: this.visit(ctx.buzzwords),
			into: ctx.into ? this.visit(ctx.into) : []
		}
	}
	into(ctx: any) {
		let path = [ctx.Identifier[0].image.slice(1,-1)]
		if(ctx.within) {
			path.concat(this.visit(ctx.within))
		}
		return path
	}
	within(ctx: any) {
		return [ctx.Identifier[0].image.slice(1,-1)]
	}
	buzzwords(ctx: any) {
		return ctx.Buzzword.map((v: any) => v.image).join(' ');
	}

})();

export const visit = (cst: CstNode): Statement => Visitor.visit(cst);
