import test from 'ava';
import { Whitespace, Identifier, Comment } from '@slangroom/shared/tokens';
import { Lexer, createToken, type IToken } from '@slangroom/deps/chevrotain';

const skipped = 'given when then and i that valid all inside am an a'.split(' ');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const capitalize = (t: string) => `${t[0]!.toUpperCase()}${t.slice(1)}`;

export const SkippedTokens = skipped.map((t) =>
	createToken({ name: capitalize(t), pattern: new RegExp(`${t} `), group: Lexer.SKIPPED })
);

const TestLexer = new Lexer([Whitespace, Comment, Identifier, ...SkippedTokens]);

const lex = (contract: string) => TestLexer.tokenize(contract);

test('identifiers are tokenized correctly', (t) => {
	// Given I have a contract with various identifiers mixed with comments and whitespace
	const contract = `# Given nothing I am all valid inside!   
'one' # and another comment
'two'
	 '\uDEAD\uBEEF'	# there's a tab before there  
# it shouldn't catch this 'three
 'four' # blanks here and there	
     'five'  #	mix of blanks and tabs 	
`;
	// When I lex it
	const lexed = lex(contract);
	// Then I must have no errors
	t.is(lexed.errors.length, 0);
	// And I must have 6 comments
	t.is(lexed.groups['comments']?.length, 6);
	lexed.groups['comments']?.forEach((x: IToken) => t.is(x.tokenType, Comment));
	// And those must be these:
	t.deepEqual(
		lexed.groups['comments']?.map((x: IToken) => x.image),
		[
			'# Given nothing I am all valid inside!   ',
			'# and another comment',
			"# there's a tab before there  ",
			"# it shouldn't catch this 'three",
			'# blanks here and there	',
			'#	mix of blanks and tabs 	',
		]
	);

	// Then I must have 5 identifiers
	t.is(lexed.tokens.length, 5);
	lexed.tokens.forEach((x: IToken) => t.is(x.tokenType, Identifier));
	// And those must be these:
	t.deepEqual(
		lexed.tokens.map((x: IToken) => x.image),
		["'one'", "'two'", "'\uDEAD\uBEEF'", "'four'", "'five'"]
	);
});

test('non-matcheds error out', (t) => {
	// Given I have a broken contract
	const contract = `broken contract`;
	// When I lex it
	const lexed = lex(contract);
	// Then I must have 2 errors, which are:
	t.deepEqual(lexed.errors, [
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

test('tokens are skipped correctly', (t) => {
	// Given I have a contract with several ignored and an identifier tokens
	const contract = "given I am 'alice'";
	// When I lex it
	const lexed = lex(contract);
	// Then I must have 1 identifier token, which is:
	t.is(lexed.tokens.length, 1);
	t.is(lexed.tokens[0]?.tokenType, Identifier);
	t.is(lexed.tokens[0]?.image, "'alice'");
});
