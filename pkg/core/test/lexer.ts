// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { lex, Token } from '@slangroom/core';

test('lexer works', (t) => {
	Object.entries<Token[][]>({
		'': [[]],
		A: [[new Token('A', 1, 0, 0)]],
		' b': [[new Token('b', 1, 1, 1)]],
		'	C': [[new Token('C', 1, 1, 1)]],
		' 	d': [[new Token('d', 1, 2, 2)]],
		'	 E': [[new Token('E', 1, 2, 2)]],
		"Given that I have a 'string' named 'password'": [
			[
				new Token('Given', 1, 0, 4),
				new Token('that', 1, 6, 9),
				new Token('I', 1, 11, 11),
				new Token('have', 1, 13, 16),
				new Token('a', 1, 18, 18),
				new Token("'string'", 1, 20, 27),
				new Token('named', 1, 29, 33),
				new Token("'password'", 1, 35, 44),
			],
		],
		"Given that I have a 'string' named 'header'": [
			[
				new Token('Given', 1, 0, 4),
				new Token('that', 1, 6, 9),
				new Token('I', 1, 11, 11),
				new Token('have', 1, 13, 16),
				new Token('a', 1, 18, 18),
				new Token("'string'", 1, 20, 27),
				new Token('named', 1, 29, 33),
				new Token("'header'", 1, 35, 42),
			],
		],
		"Given that I have a 'string' named 'message'": [
			[
				new Token('Given', 1, 0, 4),
				new Token('that', 1, 6, 9),
				new Token('I', 1, 11, 11),
				new Token('have', 1, 13, 16),
				new Token('a', 1, 18, 18),
				new Token("'string'", 1, 20, 27),
				new Token('named', 1, 29, 33),
				new Token("'message'", 1, 35, 43),
			],
		],
		"When I encrypt the secret message 'message' with 'password'": [
			[
				new Token('When', 1, 0, 3),
				new Token('I', 1, 5, 5),
				new Token('encrypt', 1, 7, 13),
				new Token('the', 1, 15, 17),
				new Token('secret', 1, 19, 24),
				new Token('message', 1, 26, 32),
				new Token("'message'", 1, 34, 42),
				new Token('with', 1, 44, 47),
				new Token("'password'", 1, 49, 58),
			],
		],
		"Then print the 'secret message'": [
			[
				new Token('Then', 1, 0, 3),
				new Token('print', 1, 5, 9),
				new Token('the', 1, 11, 13),
				new Token("'secret message'", 1, 15, 30),
			],
		],
		"Given that I have a 'string' named 'password'\nGiven that I have a 'string' named 'header'\nGiven that I have a 'string' named 'message'\nWhen I encrypt the secret message 'message' with 'password'\nThen print the 'secret message'":
			[
				[
					new Token('Given', 1, 0, 4),
					new Token('that', 1, 6, 9),
					new Token('I', 1, 11, 11),
					new Token('have', 1, 13, 16),
					new Token('a', 1, 18, 18),
					new Token("'string'", 1, 20, 27),
					new Token('named', 1, 29, 33),
					new Token("'password'", 1, 35, 44),
				],

				[
					new Token('Given', 2, 0, 4),
					new Token('that', 2, 6, 9),
					new Token('I', 2, 11, 11),
					new Token('have', 2, 13, 16),
					new Token('a', 2, 18, 18),
					new Token("'string'", 2, 20, 27),
					new Token('named', 2, 29, 33),
					new Token("'header'", 2, 35, 42),
				],

				[
					new Token('Given', 3, 0, 4),
					new Token('that', 3, 6, 9),
					new Token('I', 3, 11, 11),
					new Token('have', 3, 13, 16),
					new Token('a', 3, 18, 18),
					new Token("'string'", 3, 20, 27),
					new Token('named', 3, 29, 33),
					new Token("'message'", 3, 35, 43),
				],

				[
					new Token('When', 4, 0, 3),
					new Token('I', 4, 5, 5),
					new Token('encrypt', 4, 7, 13),
					new Token('the', 4, 15, 17),
					new Token('secret', 4, 19, 24),
					new Token('message', 4, 26, 32),
					new Token("'message'", 4, 34, 42),
					new Token('with', 4, 44, 47),
					new Token("'password'", 4, 49, 58),
				],

				[
					new Token('Then', 5, 0, 3),
					new Token('print', 5, 5, 9),
					new Token('the', 5, 11, 13),
					new Token("'secret message'", 5, 15, 30),
				],
			],
	}).forEach(([haves, wants]) => {
		haves.split('\n').forEach((give, i) => {
			const lineNo = i + 1;
			const want = [wants[i], lineNo];
			const have = lex(give, lineNo);
			if (!have.ok) throw new Error(have.error.message.message);
			t.deepEqual(have.value, want);
		});
	});

	const res = lex("When I encrypt the secret message 'message", 1);
	if (res.ok) throw new Error("Lex fail to dectect unclosed single-quote");
	t.is(res.error.message.message as string, `unclosed single-quote at 1:35-42: 'message`);
});
