// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from "ava";
import { Slangroom } from '@slangroom/core';
import { db } from '@slangroom/db';
import sqlite3 from "sqlite3";
// read the version from the package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('@slangroom/db/package.json');

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('Db should execute raw queries', async (t) => {
	const rawQuery = `Rule unknown ignore
	Given I connect to 'database' and send statement 'query_1' and execute sql statement and output into 'result_1'
	Given I connect to 'database' and send statement 'query_2'  and execute sql statement and output into 'result_2'
	Given I connect to 'database' and send statement 'query_3'  and execute sql statement and output into 'result_3'
	Given I connect to 'database' and send statement 'query_4'  and execute sql statement and output into 'result_4'
	Given I connect to 'database' and send statement 'query_5' and send parameters 'query5_params'  and execute sql statement with parameters and output into 'result_5'
	Given I connect to 'database' and send statement 'query_6' and send parameters 'query6_params'  and execute sql statement with parameters and output into 'result_6'
	Given I have a 'string dictionary' named 'result_1'
	Given I have a 'string dictionary' named 'result_2'
	Given I have a 'string dictionary' named 'result_3'
	Given I have a 'string array' named 'result_4'
	Given I have a 'string dictionary' named 'result_5'
	Given I have a 'string dictionary' named 'result_6'
	Then print all data
`;

	const create_table = `CREATE TABLE
	IF NOT EXISTS member (
	name VARCHAR(255),
	date DATETIME DEFAULT CURRENT_TIMESTAMP
	);`;
	const database = new sqlite3.Database('./test/test.db', sqlite3.OPEN_URI | sqlite3.OPEN_SHAREDCACHE | sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
		if (err) {
			throw Error(`Error Occured - ${err.message}`);
		}
	});
	database.run(create_table, (err) => {
		if (err) {
			throw Error('Some Error Occured');
		}
	});
	database.close();
	const slangroom = new Slangroom(db);
	const res = await slangroom.execute(rawQuery, {
		data: {
			"database": "sqlite://./test/test.db",
			"query_1": "INSERT INTO member (name) VALUES ('Alice')",
			"query_2": "INSERT INTO member (name) VALUES ('Bob')",
			"query_3": "UPDATE member SET name = 'Carl' WHERE name like 'Bob'",
			"query_4": "SELECT * FROM member",
			"query_5": "INSERT INTO member (name) VALUES (?)",
			"query_6": "INSERT INTO member (name) VALUES (:name)",
			"query5_params": ["Eve"],
			"query6_params": { "name": "EEve" }
		},
	});

	const results = Object.keys(res.result);
	t.deepEqual(results,
		['result_1', 'result_2', 'result_3', 'result_4', 'result_5', 'result_6']);
	const res_1 = res.result['result_1'] as { changes?: string, lastID?: string };
	const lastID_1 = Number(res_1?.lastID);
	t.true(lastID_1 && lastID_1 >= 1);
	const res_2 = res.result['result_2'] as { changes?: string, lastID?: string };
	const lastID_2 = Number(res_2?.lastID);
	t.true(lastID_2 && lastID_2 > 1);
	const res_3 = res.result['result_3'] as string[];
	t.deepEqual(res_3, []);
	const res_4 = res.result['result_4'] as Record<string, any>[];
	const elem = typeof (res_4) !== 'undefined' ? res_4[0] || {} : {};
	t.deepEqual(Object.keys(elem), ['date', 'name']);
	const res_5 = res.result['result_5'] as { changes?: string, lastID?: string };
	const lastID_5 = Number(res_5?.lastID);
	t.true(lastID_5 && lastID_5 > 1);
	const res_6 = res.result['result_6'] as { changes?: string, lastID?: string };
	const lastID_6 = Number(res_6?.lastID);
	t.true(lastID_6 && lastID_6 > 1);
});

test('Db should fail for wrong database', async (t) => {
	const rawQuery = `Rule unknown ignore
	Given I connect to 'database' and send statement 'query_1' and execute sql statement and output into 'result_1'
	Given I connect to 'database' and send statement 'query_5' and send parameters 'query5_params'  and execute sql statement with parameters and output into 'result_5'
	Given I have a 'string dictionary' named 'result_1'
	Given I have a 'string dictionary' named 'result_5'
	Then print all data
`;

	const slangroom = new Slangroom(db);
	const res = slangroom.execute(rawQuery, {
		data: {
			"database": "sqlite://./test/fake_test.db",
			"query_1": "INSERT INTO member (name) VALUES ('Alice')",
			"query_5": "INSERT INTO member (name) VALUES (?)",
			"query5_params": ["Eve"],
		},
	});
	const error = await t.throwsAsync(res);
	t.is(stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 |     Given I connect to 'database' and send statement 'query_1' and execute sql statement and output into 'result_1'
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |     Given I connect to 'database' and send statement 'query_5' and send parameters 'query5_params'  and execute sql statement with parameters and output into 'result_5'
3 |     Given I have a 'string dictionary' named 'result_1'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: SQLITE_ERROR: no such table: member
`);
});


test('Db should fail for wrong statement', async (t) => {
	const rawQuery = `Rule unknown ignore
	Given I connect to 'database' and send statement 'query_1' and execute sql statement and output into 'result_1'
	Given I connect to 'database' and send statement 'query_5' and send parameters 'query5_params'  and execute sql statement with parameters and output into 'result_5'
	Given I have a 'string dictionary' named 'result_1'
	Given I have a 'string dictionary' named 'result_5'
	Then print all data
`;

	const slangroom = new Slangroom(db);
	const res = slangroom.execute(rawQuery, {
		data: {
			"database": "sqlite://./test/test.db",
			"query_1": "INSTERT INTO member (name) VALUES ('Alice')",
			"query_5": "INSERT INTO member (name) VALUES (?)",
			"query5_params": ["Eve"],
		},
	});
	const error = await t.throwsAsync(res);
	t.is(stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 |     Given I connect to 'database' and send statement 'query_1' and execute sql statement and output into 'result_1'
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |     Given I connect to 'database' and send statement 'query_5' and send parameters 'query5_params'  and execute sql statement with parameters and output into 'result_5'
3 |     Given I have a 'string dictionary' named 'result_1'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: SQLITE_ERROR: near "INSTERT": syntax error
`);
});
