// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { BindOrReplacements, DataTypes, Model, Sequelize } from "sequelize";
// read the version from the package.json
import packageJson from '@slangroom/db/package.json' assert { type: 'json' };

class Result extends Model {
	public result!: string;
}

export class DbError extends Error {
	constructor(e: string) {
		super(e)
		this.name = 'Slangroom @slangroom/db@' + packageJson.version + ' Error'
	}
}

type DK = string | object | null | undefined;

function safeJSONParse(o: DK, errorMessage?: string): ({ ok: true, parsed: object } | { ok: false, error: string }) {
	const notNull = o ?? {};
	if (typeof notNull === "object") return { ok: true, parsed: notNull };
	try {
		return { ok: true, parsed: JSON.parse(notNull) };
	} catch (err) {
		return { ok: false, error: errorMessage ?? err };
	}
}

const p = new Plugin();

/**
 * @internal
 */

/**
*
* @param {string} statement name of the SQL statement
* @param {string} database keyName of the database
*/
export const execute = p.new('connect',
	['statement'],
	'execute sql statement',
	async (ctx) => {
		const statement = ctx.fetch('statement') as string;
		const database = ctx.fetchConnect()[0] as string;
		try {
			const db = new Sequelize(database, {
				// disable logging; default: console.log
				logging: false
			});
			const t = await db.transaction();
			const [o, m] = await db.query(statement, { transaction: t });
			await t.commit();
			const output: any = o ? o : m;
			db.close();
			return ctx.pass(output);
		} catch (error) {
			return ctx.fail(new DbError(error.message));
		}
	},
);

/**
 * @internal
 */

export const executeParams = p.new('connect',
	['statement', 'parameters'],
	'execute sql statement with parameters',
	async (ctx) => {
		const statement = ctx.fetch('statement') as string;
		const parameters = ctx.fetch('parameters') as BindOrReplacements;
		const database = ctx.fetchConnect()[0] as string;
		try {
			const db = new Sequelize(database, { logging: false });
			const t = await db.transaction();
			const [o, m] = await db.query(statement, {
				transaction: t,
				replacements: parameters
			});
			await t.commit();
			const output: any = o ? o : m;
			db.close();
			return ctx.pass(output);
		} catch (error) {
			return ctx.fail(new DbError(error.message));
		}
	},
);

/**
 * @internal
 */
/**
 * @param {string} record name of the field (row)
 * @param {string} table keyName of the table
 * @param {string} database keyName of the database
 */
export const getRecord = p.new('connect',
	['record', 'table'],
	'read the record of the table',
	async (ctx) => {
		const record = ctx.fetch('record') as string;
		const table = ctx.fetch('table') as string;
		const database = ctx.fetchConnect()[0] as string;

		const parse = (o: string) => safeJSONParse(o, `[DATABASE] Error in JSON format "${o}"`)

		try {
			var output = {}
			const db = new Sequelize(database, { logging: false });
			Result.init(
				{ result: DataTypes.TEXT },
				{
					tableName: table,
					freezeTableName: true,
					sequelize: db,
				}
			);
			await Result.sync();
			try {
				let result = await Result.findByPk(record);
				if (result) {
					result = result.get({ plain: true });
					// column name is result
					const resultData = parse(result!.result);
					if (!resultData.ok) return ctx.fail(new DbError(resultData.error));
					output = resultData.parsed;
				} else {
					return ctx.fail(new DbError(`[DATABASE]
			Returned null for id "${record}" in table "${table}" in db "${database}".`));
				}
			} catch (e) {
				return ctx.fail(new DbError(`[DATABASE]
			Something went wrong for id "${record}" in table "${table}" in db "${database}".`));
			}
			db.close();
		} catch (e) {
			return ctx.fail(new DbError(`[DATABASE] Database error: ${e}`));
		}
		return ctx.pass(output);
	},
);

/**
 * @internal
 */
export const saveVar = p.new('connect',
	['variable', 'name', 'table'],
	'save the variable in the database table',
	async (ctx) => {
		const varObj = ctx.fetch('variable') as object;
		const varName = ctx.fetch('name') as string;
		const database = ctx.fetchConnect()[0] as string;
		const table = ctx.fetch('table') as string;

		try {
			const db = new Sequelize(database, { logging: false });
			Result.init(
				{ result: DataTypes.TEXT },
				{
					tableName: table,
					freezeTableName: true,
					sequelize: db,
				}
			);
			await Result.sync();
			try {
				// column name must be result
				await Result.create({
					result: JSON.stringify({
						[varName]: varObj,
					}),
				});
			} catch (e) {
				return ctx.fail(new DbError(`[DATABASE]
				Error in table "${table}" in db "${database}": ${e}`));
			}
			db.close();
		} catch (e) {
			return ctx.fail(new DbError(`[DATABASE] Database error: ${e}`));
		}
		return ctx.pass(null);
	},
);

export const db = p;
