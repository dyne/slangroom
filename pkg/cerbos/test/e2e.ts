// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { cerbos } from '@slangroom/cerbos';

const script = `
Prepare 'res': connect to 'cerbos' and evaluate access with principal 'principal', resource 'resource', action 'action'

Given I have a 'boolean' named 'res'
Then print data
`;

test('Valid access', async (t) => {
	const slangroom = new Slangroom(cerbos);
	const res = await slangroom.execute(script, {
		data: {
			cerbos: "http://localhost:3592",
			principal: {
				id: "user@example.com",
				roles: ["user"],
				attr: { tier: "PREMIUM" },
			},
			resource: {
				kind: "document",
				id: "1",
				attr: { owner: "user@example.com" },
			},
			action: "view",
		},
	});
	t.deepEqual(res.result, { res: true }, JSON.stringify(res, null, 2));
});

test('Invalid access [tier not met]', async (t) => {
	const slangroom = new Slangroom(cerbos);
	const res = await slangroom.execute(script, {
		data: {
			cerbos: "http://localhost:3592",
			principal: {
				id: "user@example.com",
				roles: ["user"],
				attr: { tier: "GOLD" },
			},
			resource: {
				kind: "document",
				id: "1",
				attr: { owner: "user@example.com" },
			},
			action: "view",
		},
	});
	t.deepEqual(res.result, { res: false }, JSON.stringify(res, null, 2));
});

test('Invalid access [action not allowed]', async (t) => {
	const slangroom = new Slangroom(cerbos);
	const res = await slangroom.execute(script, {
		data: {
			cerbos: "http://localhost:3592",
			principal: {
				id: "user@example.com",
				roles: ["user"],
				attr: { tier: "PREMIUM" },
			},
			resource: {
				kind: "document",
				id: "1",
				attr: { owner: "user@example.com" },
			},
			action: "delete",
		},
	});
	t.deepEqual(res.result, { res: false }, JSON.stringify(res, null, 2));
});
