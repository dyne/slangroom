import { SuperTest, Test } from "supertest";
import anyTest, { TestFn } from "ava";
import { Slangroom } from '@slangroom/core';
import { db } from '@slangroom/db';
import sqlite3 from "sqlite3";

const test = anyTest as TestFn<{ app: SuperTest<Test> }>;

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
	Given I have a 'string dictionary' named 'result_4'
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
	const res_1 = res.result['result_1'] as { output?: { changes?: string, lastID?: string } };
	const lastID_1 = Number(res_1?.output?.lastID);
	t.true(lastID_1 && lastID_1 > 1);
	const res_2 = res.result['result_2'] as { output?: { changes?: string, lastID?: string } };
	const lastID_2 = Number(res_2?.output?.lastID);
	t.true(lastID_2 && lastID_2 > 1);
	const res_3 = res.result['result_3'] as { output?: string[] };
	t.deepEqual(res_3?.output, []);
	const res_4 = res.result['result_4'] as { output?: Record<string, any>[] };
	const elem = typeof (res_4.output) !== 'undefined' ? res_4.output[0] || {} : {};
	t.deepEqual(Object.keys(elem), ['date', 'name']);
	const res_5 = res.result['result_5'] as { output?: { changes?: string, lastID?: string } };
	const lastID_5 = Number(res_5?.output?.lastID);
	t.true(lastID_5 && lastID_5 > 1);
	const res_6 = res.result['result_6'] as { output?: { changes?: string, lastID?: string } };
	const lastID_6 = Number(res_6?.output?.lastID);
	t.true(lastID_6 && lastID_6 > 1);
});
