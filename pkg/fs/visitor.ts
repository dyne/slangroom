import { BaseFsVisitor, parse, type FileOverrideStatementCtx } from './parser';

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
			content: content.slice(1, -1),
			filename: filename.slice(1, -1),
		};
	}
}

export const FsVisitor = new Visitor();

/**
 * Visits the given statement for filesystems statements.
 *
 * @param statement is the statement ignored by Zenroom.
 * @returns the AST of the parsed CST.
 **/
export const visit = (statement: string) => {
	const cst = parse(statement);
	return FsVisitor.visit(cst);
};
