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
			[
				{ data: { myFile: ['pathway/to/hell'] }, keys: {} },
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


test('visitor throws error correctly', (t) => {
	(
		[
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [
						{
							message: new Error('at 1\n missing one of: Given I, Then I'),
							lineNo: 1
						}
					],
					matches: [],
				},
				'cst must not have any general errors'
			],
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [],
				},
				'cst must have only one match'
			],
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								phrase: 'a b c'
							},
							bindings: new Map(),
							err: [
								{
									message: new Error('at 1:19.22\n save may be and'),
									lineNo: 1,
									start: 19,
									end: 22
								}
							],
							lineNo: 1
						}
					]
				},
				'cst\'s match must not have any errors'
			],
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								openconnect: 'open',
								phrase: 'love asche'
							},
							bindings: new Map(),
							open: 'myFile',
							err: [],
							lineNo: 1
						},
					],
				},
				'myFile must contain a value'
			],
			[
				{ data: {myFile: 42}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								openconnect: 'open',
								phrase: 'love asche'
							},
							bindings: new Map(),
							open: 'myFile',
							err: [],
							lineNo: 1
						},
					],
				},
				'myFile must contain a value'
			],
			[
				{ data: {myFile: ['pathway/to/hell', 42]}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								openconnect: 'open',
								phrase: 'love asche'
							},
							bindings: new Map(),
							open: 'myFile',
							err: [],
							lineNo: 1
						},
					],
				},
				'the array referenced by myFile must solely composed of strings'
			],
			[
				{ data: {}, keys: {} },
				{
					givenThen: 'given',
					errors: [],
					matches: [
						{
							key: {
								params: ['object'],
								phrase: 'a b c'
							},
							bindings: new Map([['object', 'myObj']]),
							err: [],
							lineNo: 1
						},
					],
				},
				'Can\'t find myObj in DATA or KEYS'
			],
		] as [ZenParams, Cst, string][]
	).forEach(([params, cst, errMessage]) => {
		const err = t.throws(() => {
			visit(cst, params);
		})
		t.is(err.message, errMessage);
	});
});
