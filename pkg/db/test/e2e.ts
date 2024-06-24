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
const dbPath1 = "sqlite://./test/db1.db";
const dbPath2 = "sqlite://./test/db2.db";

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
		Then I connect to 'myDb2' and send variable 'keyring' and send name 'key_name' and send table 'myCache' and save the variable in the database table
		`;

test.afterEach(() => {
	try {
		fs.unlinkSync("./test/db1.db");
	} catch (e) {
		throw e;
	}
	try {
		fs.unlinkSync("./test/db2.db");
	} catch (e) {
		throw e;
	}
});

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
	try {
		const results = Array(5).fill(JSON.stringify({
			testkey: "test value"
		}));
		for (const result of results) {
			await Table.create({
				result
			});
		}
	} catch (e) {
		throw e;
	}
	sequelize.close();
});


test.serial('Middleware db should work and response includes variable for db', async (t) => {
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(complexQuery, {
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
	const res = await result;
	try {
		t.true(
			Object.keys(res.result).includes("keyring"), ""
		);
		t.true(
			Object.keys(res.result).includes("myZenroomStringDictionary"),
			'could not find "myZenroomStringDictionary" in response'
		);
	} catch (e) {
		throw e;
	}
});

class Result1 extends Model {
	public result!: any;
}

test.serial(
	"Middleware db should save the result of variable given in zencode to db2",
	async (t) => {
		try {
			const slangroom = new Slangroom(db);
			const result = slangroom.execute(complexQuery, {
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
			const res = await result;
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
			let ress;
			try {
				let query = await Result2.findByPk(1) as Result1;
				query = query!.get({
					plain: true
				});
				ress = JSON.parse(query!["result"]);
			} catch (e) {
				ress = null;
			}
			sequelize2.close();
			t.deepEqual(
				res.result['keypair'],
				ress.keypair,
				"The value stored in the database should be the same as the value in the response body"
			);
		} catch (e) {
			throw e;
		}
	}
);

test.serial('Db should fail for wrong record', async (t) => {
	const failQuery = `Rule unknown ignore
		Scenario 'ecdh': Create the keypair
		Given I connect to 'myDb2' and send variable 'obj_1' and send name 'var_name' and send table 'myCache' and save the variable in the database table
		# the value of the record could be 0 to max could be
		Given I connect to 'myDb1' and send record 'n' and send table 'myTable' and read the record of the table and output into 'myZenroomStringDictionary'
		Given I am 'John'
		Given I have a 'string' named 'myDb1'
		Given I have a 'string' named 'myDb2'
		Given I have a 'string' named 'myTable'
		Given I have a 'string' named 'myCache'
		Given I have a 'string dictionary' named 'myZenroomStringDictionary'
		Then print all data
		`;
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(failQuery, {
		data: {
			"n": 30,
			"var_name": "obj_1",
			"obj_1": "pippo",
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

	const error = await t.throwsAsync(result);
	t.is(stripAnsiCodes((error as Error).message),
		`3 |         # the value of the record could be 0 to max could be
4 |         Given I connect to 'myDb1' and send record 'n' and send table 'myTable' and read the record of the table and output into 'myZenroomStringDictionary'
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
5 |         Given I am 'John'
6 |         Given I have a 'string' named 'myDb1'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: [DATABASE]
			Returned null for id "30" in table "firstTable" in db "sqlite://./test/db1.db".

Heap:
{
    "data": {
        "n": 30,
        "var_name": "obj_1",
        "obj_1": "pippo",
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
    "keys": {}
}
`);
});

test.serial('Db should fail for wrong db', async (t) => {
	const failQuery = `Rule unknown ignore
		Scenario 'ecdh': Create the keypair
		# the value of the record could be 0 to max could be
		Given I connect to 'myDb1' and send record 'n' and send table 'myTable' and read the record of the table and output into 'myZenroomStringDictionary'
		Given I am 'John'
		Given I have a 'string' named 'obj_1'
		Given I have a 'string' named 'var_name'
		Given I have a 'string' named 'myDb1'
		Given I have a 'string' named 'myDb2'
		Given I have a 'string' named 'myTable'
		Given I have a 'string' named 'myCache'
		Given I have a 'string dictionary' named 'myZenroomStringDictionary'
		Then print all data
		Then I connect to 'myDb2' and send variable 'obj_1' and send name 'var_name' and send table 'myCache' and save the variable in the database table
		Then I connect to 'myTable' and send variable 'obj_1' and send name 'var_name' and send table 'myCache' and save the variable in the database table`;
	const slangroom = new Slangroom(db);
	const result = slangroom.execute(failQuery, {
		data: {
			"n": 3,
			"var_name": "obj_1",
			"obj_1": "pippo",
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

	const error = await t.throwsAsync(result);
	t.is(stripAnsiCodes((error as Error).message),
		`13 |         Then I connect to 'myDb2' and send variable 'obj_1' and send name 'var_name' and send table 'myCache' and save the variable in the database table
14 |         Then I connect to 'myTable' and send variable 'obj_1' and send name 'var_name' and send table 'myCache' and save the variable in the database table
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/db@${packageJson.version} Error: [DATABASE] Database error: TypeError: Cannot read properties of null (reading 'replace')

Heap:
{
    "data": {
        "myCache": "firstCache",
        "myDb1": "sqlite://./test/db1.db",
        "myDb2": "sqlite://./test/db2.db",
        "myTable": "firstTable",
        "myZenroomStringDictionary": {
            "testkey": "test value"
        },
        "obj_1": "pippo",
        "var_name": "obj_1"
    },
    "keys": {}
}
`);
});
