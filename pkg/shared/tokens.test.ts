import { Whitespace, Identifier, Comment } from './tokens';

import { Lexer, createToken, type IToken } from '@slangroom/deps/chevrotain';

const skipped = 'given when then and i that valid all inside am an a'.split(' ');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const capitalize = (t: string) => `${t[0]!.toUpperCase()}${t.slice(1)}`;

export const SkippedTokens = skipped.map((t) =>
	createToken({ name: capitalize(t), pattern: new RegExp(`${t} `), group: Lexer.SKIPPED })
);

const TestLexer = new Lexer([Whitespace, Comment, Identifier, ...SkippedTokens]);

const lex = (contract: string) => TestLexer.tokenize(contract);

test('that identifiers are identified correctly', () => {
	// Given I have a contract with various identifiers mixed with comments and whitespace
	const contract = `# Given nothing I am all valid inside!   
'one' # and another comment
'two'
	 '\uDEAD\uBEEF'	# there's a tab before there  
# it shouldn't catch this 'three
 'four' # blanks here and there	
     'five'  #	mix of blanks and tabs 	
`;
	// When I lex the it
	const lexed = lex(contract);
	// Then I must have no errors
	expect(lexed.errors).toHaveLength(0);

	// Then I must have 6 comments
	expect(lexed.groups).toHaveProperty('comments');
	expect(lexed.groups['comments']).toHaveLength(6);
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	lexed.groups['comments']!.forEach((x: IToken) => expect(x.tokenType).toBe(Comment));
	// and those must be these:
	expect(lexed.groups['comments']![0]!.image).toStrictEqual(
		'# Given nothing I am all valid inside!   '
	);
	expect(lexed.groups['comments']![1]!.image).toStrictEqual('# and another comment');
	expect(lexed.groups['comments']![2]!.image).toStrictEqual("# there's a tab before there  ");
	expect(lexed.groups['comments']![3]!.image).toStrictEqual("# it shouldn't catch this 'three");
	expect(lexed.groups['comments']![4]!.image).toStrictEqual('# blanks here and there	');
	expect(lexed.groups['comments']![5]!.image).toStrictEqual('#	mix of blanks and tabs 	');
	/* eslint-enable */

	// Then I must have 5 identifiers
	expect(lexed.tokens).toHaveLength(5);
	lexed.tokens.forEach((x) => expect(x.tokenType).toBe(Identifier));
	// and those must be these:
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	expect(lexed.tokens[0]!.image).toStrictEqual("'one'");
	expect(lexed.tokens[1]!.image).toStrictEqual("'two'");
	expect(lexed.tokens[2]!.image).toStrictEqual("'\uDEAD\uBEEF'");
	expect(lexed.tokens[3]!.image).toStrictEqual("'four'");
	expect(lexed.tokens[4]!.image).toStrictEqual("'five'");
	/* eslint-enable */
});

test('that non-matcheds error out', () => {
	// Given I have a broken contract
	const contract = `broken contract`;
	// When I lex it
	const lexed = lex(contract);
	// Then I must have 2 errors, which are:
	expect(lexed.errors).toStrictEqual([
		{
			offset: 0,
			length: 6,
			line: 1,
			column: 1,
			message: 'unexpected character: ->b<- at offset: 0, skipped 6 characters.',
		},
		{
			offset: 7,
			length: 8,
			line: 1,
			column: 2,
			message: 'unexpected character: ->c<- at offset: 7, skipped 8 characters.',
		},
	]);
});

test('that tokens are skipped correctly', () => {
	// Given I have a contract with several ignored and an identifier tokens
	const contract = "given I am 'alice'";
	// When I lex it
	const lexed = lex(contract);
	// Then I must have 1 identifier token, which is:
	expect(lexed.tokens).toHaveLength(1);
	/* eslint-disable @typescript-eslint/no-non-null-assertion */
	expect(lexed.tokens[0]!.tokenType).toBe(Identifier);
	expect(lexed.tokens[0]!.image).toStrictEqual("'alice'");
	/* eslint-enable */
});
