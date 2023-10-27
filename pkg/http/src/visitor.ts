import { CstVisitor, type KindCst, type MethodCst, type PhraseCst } from '@slangroom/http';

export type RequestAst = {
	method: RequestMethod;
	kind: RequestKind;
};

export enum RequestMethod {
	Get = 'get',
	Post = 'post',
	Patch = 'patch',
	Put = 'put',
	Delete = 'delete',
}

export enum RequestKind {
	Default,
	Parallel,
	Sequential,
	Same,
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface V {
	visit(cst: PhraseCst): ReturnType<this['phrase']>;
	visit(cst: KindCst): ReturnType<this['kind']>;
	visit(cst: MethodCst): ReturnType<this['method']>;
}

class V extends CstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	phrase(ctx: PhraseCst['children']): RequestAst {
		return {
			method: this.visit(ctx.method),
			kind: ctx.kind ? this.visit(ctx.kind) : RequestKind.Default,
		};
	}

	kind(ctx: KindCst['children']): RequestKind {
		if (ctx.Sequential) return RequestKind.Sequential;
		if (ctx.Parallel) return RequestKind.Parallel;
		if (ctx.Same) return RequestKind.Same;
		throw new Error('Should not be here: unknown request kind');
	}

	method(ctx: MethodCst['children']): RequestMethod {
		if (ctx.Post) return RequestMethod.Post;
		if (ctx.Get) return RequestMethod.Get;
		if (ctx.Patch) return RequestMethod.Patch;
		if (ctx.Put) return RequestMethod.Put;
		if (ctx.Delete) return RequestMethod.Delete;
		throw new Error('Should not be here: unknown request method');
	}
}

const Visitor = new V();

export const visit = (cst: PhraseCst): RequestAst => Visitor.visit(cst);
