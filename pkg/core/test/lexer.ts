// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { lex, Token, LexError } from '@slangroom/core';

test('lexer works', (t) => {
	Object.entries<Token[]>({
		'': [],
		A: [new Token('A', 0, 0)],
		' b': [new Token('b', 1, 1)],
		'	C': [new Token('C', 1, 1)],
		' 	d': [new Token('d', 2, 2)],
		'	 E': [new Token('E', 2, 2)],
		"Given that I have a 'string' named 'password'": [
			new Token('Given', 0, 4),
			new Token('that', 6, 9),
			new Token('I', 11, 11),
			new Token('have', 13, 16),
			new Token('a', 18, 18),
			new Token("'string'", 20, 27),
			new Token('named', 29, 33),
			new Token("'password'", 35, 44),
		],
		"Given that I have a 'string' named 'header'": [
			new Token('Given', 0, 4),
			new Token('that', 6, 9),
			new Token('I', 11, 11),
			new Token('have', 13, 16),
			new Token('a', 18, 18),
			new Token("'string'", 20, 27),
			new Token('named', 29, 33),
			new Token("'header'", 35, 42),
		],
		"Given that I have a 'string' named 'message'": [
			new Token('Given', 0, 4),
			new Token('that', 6, 9),
			new Token('I', 11, 11),
			new Token('have', 13, 16),
			new Token('a', 18, 18),
			new Token("'string'", 20, 27),
			new Token('named', 29, 33),
			new Token("'message'", 35, 43),
		],
		"When I encrypt the secret message 'message' with 'password'": [
			new Token('When', 0, 3),
			new Token('I', 5, 5),
			new Token('encrypt', 7, 13),
			new Token('the', 15, 17),
			new Token('secret', 19, 24),
			new Token('message', 26, 32),
			new Token("'message'", 34, 42),
			new Token('with', 44, 47),
			new Token("'password'", 49, 58),
		],
		"Then print the 'secret message'": [
			new Token('Then', 0, 3),
			new Token('print', 5, 9),
			new Token('the', 11, 13),
			new Token("'secret message'", 15, 30),
		],
	}).forEach(([give, want]) => {
		const have = lex(give);
		t.deepEqual(have, want);
	});

	const err = t.throws(() => lex("When I encrypt the secret message 'message"), {
		instanceOf: LexError,
	}) as LexError;
	t.is(err.message, `unclosed single-quote at 34,41: 'message`);
});
