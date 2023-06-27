import { ZenroomParams } from '../shared/zenroom';
import { BaseFsVisitor, parse, type FileOverrideStatementCtx } from './parser';

import { type CstNode } from 'chevrotain';

export type FileOverrideStatement = {
	content: string;
	filename: string;
};

interface Visitor {
	visit(params: CstNode): FileOverrideStatement;
}

class Visitor extends BaseFsVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	fileOverrideStatement(ctx: FileOverrideStatementCtx) {
		const content = ctx.content[0].image;
		const filename = ctx.filename[0].image;
		return {
			content: content,
			filename: filename
		};
	}
}

export const FsVisitor = new Visitor();

export const visit = async (contract: string, params?: ZenroomParams) => {
	const parsed = await parse(contract, params);
	return FsVisitor.visit(parsed);
};
