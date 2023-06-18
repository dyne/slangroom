import { tokenMatcher } from 'chevrotain';
import { WhiteSpace, tokenize, Comment } from './main';

test('tokens and identifiers are handeld correctly', () => {
	const contract = `# Given nothing
'one' # and another comment
'two'
	`;
	const result = tokenize(contract);

	expect(result.errors.length).toBe(0);
	expect(result.tokens.length).toBe(2);
	expect(result.groups['comments'].length).toBe(2);
	expect(result.groups['comments'][0].image).toBe('# Given nothing');
	expect(result.groups['comments'][1].image).toBe('# and another comment');
	expect(result.tokens[0].image).toBe("'one'");
	expect(result.tokens[1].image).toBe("'two'");

	result.tokens.map((t) => {
		expect(tokenMatcher(t, WhiteSpace)).toBe(false);
	});

	expect(tokenMatcher(result.groups['comments'][0], Comment)).toBe(true);
	expect(tokenMatcher(result.groups['comments'][1], Comment)).toBe(true);
});

test('wrong tokens print error', () => {
	const contract = `broken contract`;
	const result = tokenize(contract);
	const errors = [
		{
			offset: 0,
			line: 1,
			column: 1,
			length: 6,
			message: 'unexpected character: ->b<- at offset: 0, skipped 6 characters.'
		},
		{
			offset: 7,
			line: 1,
			column: 2,
			length: 8,
			message: 'unexpected character: ->c<- at offset: 7, skipped 8 characters.'
		}
	];
	expect(result.errors.length).toBe(2);
	expect(result.errors).toEqual(errors);
});
