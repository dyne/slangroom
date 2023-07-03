import { Whitespace } from '@slangroom/shared';
import { createToken, CustomPatternMatcherFunc } from '@slangroom/deps/chevrotain';

/*
 * Prevent regex-ast annoing warnings
 * https://github.com/Chevrotain/chevrotain/issues/1670#issuecomment-1001673472
 * */
const wrap = (regex: RegExp): CustomPatternMatcherFunc => {
    return (text: string, offset: number): RegExpExecArray | null => {
        const re = new RegExp(regex, 'y');
        re.lastIndex = offset
        return re.exec(text)
    }
}


/**
 * Statements ignored by Zenroom.
 *
 * When Zenroom encounters with a statement it doesn't understand, it
 * prints that statement out on stderr in the following format (mind the
 * two spaces between "[W]" and "Zencode"):
 *
 * [W]  Zencode pattern ignored: The pattern that doesn't exist goes here
 */
export const IgnoredStatements = createToken({
	name: 'IgnoredStatements',
	// eslint-disable-next-line no-regex-spaces
	pattern: wrap(/(?<=\[W\]  Zencode pattern ignored: ).*/),
	line_breaks: false,
});

/**
 * Vocabulary to find ignored statements.
 */
export const vocab = [Whitespace, IgnoredStatements];
