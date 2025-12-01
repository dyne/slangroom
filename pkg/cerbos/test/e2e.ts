// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { cerbos } from '@slangroom/cerbos';
import packageJson from '@slangroom/cerbos/package.json' with { type: 'json' };

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').replace(/[ \t]+(?=\r?\n|$)/g, '');

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

test('Invalid url', async (t) => {
	const slangroom = new Slangroom(cerbos);
	const fn = slangroom.execute(script, {
		data: {
			cerbos: "not_a_url",
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
	const error = await t.throwsAsync(fn);
	t.is(stripAnsiCodes((error as Error).message),
`0 |
1 | Prepare 'res': connect to 'cerbos' and evaluate access with principal 'principal', resource 'resource', action 'action'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |
3 | Given I have a 'boolean' named 'res'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/cerbos@${packageJson.version} Error: gRPC error 2 (UNKNOWN): Request failed: Failed to parse URL from not_a_url/api/check/resources

Heap:
{
    "cerbos": "not_a_url",
    "principal": {
        "id": "user@example.com",
        "roles": [
            "user"
        ],
        "attr": {
            "tier": "PREMIUM"
        }
    },
    "resource": {
        "kind": "document",
        "id": "1",
        "attr": {
            "owner": "user@example.com"
        }
    },
    "action": "view"
}
`);
});
