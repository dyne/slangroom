import { CstVisitor } from '@slangroom/core/parser';
import type { CstNode } from '@slangroom/deps/chevrotain';

export type Statement = Read | Connect | ReadInto | ReadIntoWithin | ReadAndSave;

export enum StatementType {
	Read,
	Connect,
	ReadInto,
	ReadIntoWithin,
	ReadAndSave,
}

export type Read = {
	type: StatementType.Read;
	read: Action;
};

export type Connect = {
	type: StatementType.Connect;
	connect: Action;
};

export type ReadInto = {
	type: StatementType.ReadInto;
	read: Action;
	into: string;
};

export type ReadIntoWithin = {
	type: StatementType.ReadIntoWithin;
	read: Action;
	into: string;
	within: string;
};

export type ReadAndSave = {
	type: StatementType.ReadAndSave;
	read: Action;
	save: Action;
};

export type Action = {
	phrase: string;
	args: string[];
};

export const Visitor = new (class extends CstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	statement(ctx: any) {
		if (ctx.connect) return this.visit(ctx.connect);
		if (ctx.read) return this.visit(ctx.read);
		throw new Error('statement: UNREACHABLE');
	}

	connect(ctx: any) {
		return {
			type: StatementType.Connect,
			connect: this.visit(ctx.action),
		};
	}

	read(ctx: any) {
		const ret = ctx.andSave
			? this.visit(ctx.andSave)
			: ctx.into
				? this.visit(ctx.into)
				: { type: StatementType.Read };
		ret.read = this.visit(ctx.readAction);
		return ret;
	}

	andSave(ctx: any) {
		return {
			type: StatementType.ReadAndSave,
			save: this.visit(ctx.saveAction),
		};
	}

	into(ctx: any) {
		const ret = ctx.within ? this.visit(ctx.within) : { type: StatementType.ReadInto };
		ret.into = ctx.intoIdentifier[0].image.slice(1, -1);
		return ret;
	}

	within(ctx: any) {
		return {
			type: StatementType.ReadIntoWithin,
			within: ctx.withinIdentifier[0].image.slice(1, -1),
		};
	}

	action(ctx: any) {
		const { phrases, args } = ctx.phrase.reduce(
			(acc: { phrases: string[]; args: string[] }, cur: any) => {
				const [buzzword, ident] = this.visit(cur);
				acc.phrases.push(buzzword);
				if (ident) acc.args.push(ident);
				return acc;
			},
			{ phrases: [], args: [] }
		);

		return {
			phrase: phrases.join(' '),
			args: args,
		};
	}

	phrase(ctx: any) {
		if (ctx.Identifier)
			return [`${ctx.Buzzword[0].image} ''`, ctx.Identifier?.[0].image.slice(1, -1)];
		return [ctx.Buzzword[0].image, null];
	}
})();

export const visit = (cst: CstNode): Statement => Visitor.visit(cst);
