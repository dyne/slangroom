import { BaseFsVisitor, parse, type FileOverrideStatementCtx } from './parser';

import type { ZenroomParams } from '@slangroom/shared';
import type { CstNode } from '@slangroom/deps/chevrotain';

export type FileOverrideStatement = {
	content: string;
	filename: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
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
			filename: filename,
		};
	}
}

export const FsVisitor = new Visitor();

export const visit = async (contract: string, params?: ZenroomParams) => {
	const parsed = await parse(contract, params);
	return FsVisitor.visit(parsed);
};
