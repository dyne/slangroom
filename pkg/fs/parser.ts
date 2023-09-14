import { IntoTheFile, SaveThe, Then, And, I, vocab } from './tokens';
import { lex } from './lexer';

import { CstParser, IToken } from 'chevrotain';
import { Identifier } from '@slangroom/shared/tokens';

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

	fileOverrideStatement = this.RULE('fileOverrideStatement', () => {
		this.OR([
			{ ALT: () => this.CONSUME(Then) },
			{ ALT: () => this.CONSUME(And) },
		]);
		this.CONSUME(I);
		this.CONSUME(SaveThe);
		this.CONSUME(Identifier, { LABEL: 'content' });
		this.CONSUME(IntoTheFile);
		this.CONSUME2(Identifier, { LABEL: 'filename' });
	});
}

export const FsParser = new Parser();
export const BaseFsVisitor = FsParser.getBaseCstVisitorConstructor();

/**
 * Parses the given statement for filesystems statements.
 *
 * @param statement is the statement ignored by Zenroom.
 * @returns the CST of the lexed statement.
 **/
export const parse = (statement: string) => {
	const lexed = lex(statement);
	FsParser.input = lexed.tokens;
	return FsParser.fileOverrideStatement();
};
