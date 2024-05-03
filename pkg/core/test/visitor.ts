// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { visit, type Cst, type Ast } from '@slangroom/core';
import { ZenParams } from '@slangroom/shared';
import { inspect } from 'util';

test('visitor works', (t) => {
	(
		[
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: { phrase: 'love asche' },
							bindings: new Map(),
							err: [],
							lineNo: 1
						},
					],
				},
				{
					key: { phrase: 'love asche' },
					params: new Map(),
				},
			],
			[
				{ data: { value: 'so much' }, keys: {} },
				{
					givenThen: 'then',
					errors: [],
					matches: [
						{
							key: {
								params: new Set(['howmuch']),
								phrase: 'love asche',
							},
							bindings: new Map([['howmuch', 'value']]),
							err: [],
							lineNo: 1
						},
					],
				},
				{
					key: {
						params: new Set(['howmuch']),
						phrase: 'love asche',
					},
					params: new Map([['howmuch', 'so much']]),
				},
			],
			[
				{
					data: { myObj: 'some data', myUrl: 'https://example.com/pathway/to/hell' },
					keys: {},
				},
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								openconnect: 'connect',
								params: new Set(['object']),
								phrase: 'http post request',
							},
							bindings: new Map([['object', 'myObj']]),
							connect: 'myUrl',
							err: [],
							lineNo: 1
						},
					],
				},
				{
					key: {
						openconnect: 'connect',
						params: new Set(['object']),
						phrase: 'http post request',
					},
					params: new Map([['object', 'some data']]),
					connect: ['https://example.com/pathway/to/hell'],
				},
			],
			[
				{ data: { myFile: 'pathway/to/hell' }, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								openconnect: 'open',
								params: new Set(),
								phrase: 'read file',
							},
							bindings: new Map(),
							open: 'myFile',
							err: [],
							lineNo: 1
						},
					],
				},
				{
					key: {
						openconnect: 'open',
						params: new Set(),
						phrase: 'read file',
					},
					params: new Map(),
					open: ['pathway/to/hell'],
				},
			],
		] as [ZenParams, Cst, Ast][]
	).forEach(([params, cst, want]) => {
		const { ast: have } = visit(cst, params);
		t.deepEqual(have, want, inspect(cst, false, null));
	});
});
