// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { db } from '@slangroom/db';
import { DataTypes, Model, Sequelize } from 'sequelize';
import fs from "fs";
// read the version from the package.json
import packageJson from '@slangroom/db/package.json' with { type: 'json' };

process.env['FILES_DIR'] = "./test";
const fileDb1 = './test/db1.db';
const fileDb2 = './test/db2.db';
const dbPath1 = `sqlite://${fileDb1}`;
const dbPath2 = `sqlite://${fileDb2}`;

class Result1 extends Model {
	public result!: string;
}

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const complexQuery = `Rule unknown ignore
Scenario 'ecdh': Create the keypair
# the value of the record could be 0 to max could be
Given I connect to 'myDb1' and send record 'n' and send table 'myTable' and read the record of the table and output into 'myZenroomStringDictionary'
Given I am 'John'
Given I have a 'string' named 'key_name'
Given I have a 'string' named 'myDb1'
Given I have a 'string' named 'myDb2'
Given I have a 'string' named 'myTable'
Given I have a 'string' named 'myCache'
Given I have a 'string dictionary' named 'myZenroomStringDictionary'
When I create the ecdh key
When I create the signature of 'myZenroomStringDictionary'
When I create the array of '8' random objects of '256' bits
Then print all data
Then print the keyring
Then I connect to 'myDb2' and send variable 'keyring' and send name 'key_name' and send table 'myCache' and save the variable in the database table`;

const readQuery = `Rule unknown ignore
Given I connect to 'db' and send record 'n' and send table 'myTable' and read the record of the table and output into 'result'
Given I have a 'string dictionary' named 'result'
Then print all data`;
//

test.beforeEach(async () => {
	const sequelize = new Sequelize(dbPath1, { logging: false });
	const Table = sequelize.define("firstTable", {
		result: {
			type: DataTypes.STRING,
		},
	}, {
		freezeTableName: true,
	});
	await Table.sync();
	const results = Array(5).fill(JSON.stringify({
		testkey: "test value"
	}));
	for (const result of results) {
		await Table.create({
			result
		});
	}
	sequelize.close();
});

test.afterEach(() => {
	if (fs.existsSync(fileDb1)) fs.unlinkSync(fileDb1);
	if (fs.existsSync(fileDb2)) fs.unlinkSync(fileDb2);
});

test.serial('Db read from a db and write in another one', async (t) => {
	const slangroom = new Slangroom(db);
	const res = await slangroom.execute(complexQuery, {
		data: {
			"n": 3,
			"key_name": "keyring",
			"myDb1": "sqlite://./test/db1.db",
			"myDb2": "sqlite://./test/db2.db",
			"myTable": "firstTable",
			"myCache": "firstCache",
			"myOtherZenroomStringDictionary": {
				"data": {
					"data1": "9WgBlK+Kcq3AKpmhituXQe4UPkzH3zpZiQa4Szm1Q40=",
					"data2": "BCEo8MgRiSxtLfxE4UEDVnbdZ21h+xc+egLIRk3VTagpJxlBfu9MjqXGUi2N7tIewpcDrr5V7Z2cmMcNsbKWSGQ="
				}
			}
		},
	});
	// check the result
	t.true(
		Object.keys(res.result).includes("keyring"),
		'could not find "keyring" in response'
	);
	t.true(
		Object.keys(res.result).includes("myZenroomStringDictionary"),
		'could not find "myZenroomStringDictionary" in response'
	);
	// check the database
	const sequelize2 = new Sequelize(dbPath2, { logging: false });
	const Result2 = sequelize2.define(
		"firstCache", {
			result: {
				type: DataTypes.STRING,
			},
		}, {
			freezeTableName: true,
		}
	);
	await Result2.sync();
	let res2;
	try {
		let query = await Result2.findByPk(1) as Result1;
		query = query?.get({ plain: true });
		res2 = JSON.parse(query?.["result"] ?? "{}");
	} catch (e) {
		res2 = null;
	}
	sequelize2.close();
	t.deepEqual(
		res.result['keypair'],
		res2.keypair,
		"The value stored in the database should be the same as the value in the response body"
	);
});

test.serial('Db should fail for wrong record', async (t) => {
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(readQuery, {
		data: {
			"n": 30,
			"db": "sqlite://./test/db1.db",
			"myTable": "firstTable",
		}
	});

	const error = await t.throwsAsync(result);
	t.is(stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 | Given I connect to 'db' and send record 'n' and send table 'myTable' and read the record of the table and output into 'result'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string dictionary' named 'result'
3 | Then print all data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: Returned null for id "30" in table "firstTable"

Heap:
{
    "n": 30,
    "db": "sqlite://./test/db1.db",
    "myTable": "firstTable"
}
`);
});

test.serial('Db should fail for wrong db dialect', async (t) => {
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(readQuery, {
		data: {
			"n": 3,
			"myTable": "firstTable",
			"db": "mariodb://usr:pwd@example.com"
		},
	});

	const error = await t.throwsAsync(result);
	t.is(stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 | Given I connect to 'db' and send record 'n' and send table 'myTable' and read the record of the table and output into 'result'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string dictionary' named 'result'
3 | Then print all data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: The dialect mariodb is not supported. Supported dialects: mssql, mariadb, mysql, oracle, postgres, db2 and sqlite.

Heap:
{
    "n": 3,
    "myTable": "firstTable",
    "db": "mariodb://usr:pwd@example.com"
}
`);
});

test.serial('Db should fail with wrong db url', async (t) => {
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(readQuery, {
		data: {
			"n": 3,
			"myTable": "firstTable",
			"db": "mariadb/user:pwdo@example.com"
		},
	});

	const error = await t.throwsAsync(result);
	t.is(stripAnsiCodes((error as Error).message),
		`0 | Rule unknown ignore
1 | Given I connect to 'db' and send record 'n' and send table 'myTable' and read the record of the table and output into 'result'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | Given I have a 'string dictionary' named 'result'
3 | Then print all data

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: Invalid URL

Heap:
{
    "n": 3,
    "myTable": "firstTable",
    "db": "mariadb/user:pwdo@example.com"
}
`);
});
