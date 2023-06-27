import { Identifier } from '../shared/tokens';
import { ZenroomParams } from '../shared/zenroom';
import { IntoTheFile, SaveThe, ThenI, vocab } from './tokens';
import { lex } from './lexer';

import { CstParser, IToken } from 'chevrotain';

export type FileOverrideStatementCtx = {
	ThenI: [IToken];
	SaveThe: [IToken];
	content: [IToken];
	IntoTheFile: [IToken];
	filename: [IToken];
};

class Parser extends CstParser {
	constructor() {
		super(vocab);
		this.performSelfAnalysis();
	}

	public fileOverrideStatement = this.RULE('fileOverrideStatement', () => {
		this.CONSUME(ThenI);
		this.CONSUME(SaveThe);
		this.CONSUME(Identifier, { LABEL: 'content' });
		this.CONSUME(IntoTheFile);
		this.CONSUME2(Identifier, { LABEL: 'filename' });
	});
}

export const FsParser = new Parser();
export const BaseFsVisitor = FsParser.getBaseCstVisitorConstructor();

export const parse = async (contract: string, params?: ZenroomParams) => {
	const lexed = await lex(contract, params);
	FsParser.input = lexed.tokens;
	return FsParser.fileOverrideStatement();
};
