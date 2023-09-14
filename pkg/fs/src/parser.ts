import { IntoTheFile, SaveThe, vocab } from '@slangroom/fs/tokens';
import { lex } from '@slangroom/fs/lexer';
import { CstParser, type IToken } from '@slangroom/deps/chevrotain';
import { Then, I, Identifier } from '@slangroom/shared/tokens';

export type FileOverrideStatementCtx = {
	Then: [IToken];
	I: [IToken];
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
		this.CONSUME(Then);
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
