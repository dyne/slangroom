// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { JsonableObject } from '@slangroom/shared';
import {
	QueryOptions,
	ConnectionRefusedError,
	BindOrReplacements,
	DataTypes,
	Model,
	Sequelize
} from "sequelize";
// read the version from the package.json
import packageJson from '@slangroom/db/package.json' with { type: 'json' };

export const version = packageJson.version;

class Result extends Model {
	public result: string = "";
}

export class DbError extends Error {
	constructor(e: string) {
		super(e)
		this.name = 'Slangroom @slangroom/db@' + packageJson.version + ' Error'
	}
}

type DK = string | object | null | undefined;

const safeJSONParse = (o: DK):
	({ ok: true, parsed: JsonableObject } | { ok: false, error: string }) => {
	const notNull = o ?? {};
	if (typeof notNull === "object") return { ok: true, parsed: notNull as JsonableObject };
	try {
		return { ok: true, parsed: JSON.parse(notNull) };
	} catch (err) {
		return { ok: false, error: err.message };
	}
}

const safeDbInit = (database: string):
	({ ok: true, db: Sequelize } | { ok: false, error: string }) => {
	try {
		const urlParts = new URL(database);
		if (!urlParts.protocol.endsWith(':'))
			throw new Error('invalid url, it must start with "dialect://"');
		const db = new Sequelize(database, { logging: false	});
		return { ok: true, db };
	} catch (err) {
		return { ok: false, error: err.message }
	}
}

const safeDbQuery = async (db: Sequelize, statement: string, params?: BindOrReplacements):
	Promise<{ ok: true, res: any } | { ok: false, error: string }> => {
	try {
		const t = await db.transaction();
		const opt: QueryOptions = {
			transaction: t
		};
		if (params) opt.replacements = params;
		const [o, m] = await db.query(statement, opt);
		await t.commit();
		return { ok: true, res: o ? o : m };
	} catch (err) {
		if (err instanceof ConnectionRefusedError)
			return { ok: false, error: 'connection refused' };
		return { ok: false, error: err.message };
	} finally {
		db.close();
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
		const initRes = safeDbInit(database);
		if (!initRes.ok) return ctx.fail(new DbError(initRes.error));
		const queryRes = await safeDbQuery(initRes.db, statement);
		if (!queryRes.ok) return ctx.fail(new DbError(queryRes.error));
		return ctx.pass(queryRes.res);
	}
);

/**
 * @internal
 */

export const executeParams = p.new('connect',
	['statement', 'parameters'],
	'execute parametrized sql statement',
	async (ctx) => {
		const statement = ctx.fetch('statement') as string;
		const parameters = ctx.fetch('parameters') as BindOrReplacements;
		const database = ctx.fetchConnect()[0] as string;
		const initRes = safeDbInit(database);
		if (!initRes.ok) return ctx.fail(new DbError(initRes.error));
		const queryRes = await safeDbQuery(initRes.db, statement, parameters);
		if (!queryRes.ok) return ctx.fail(new DbError(queryRes.error));
		return ctx.pass(queryRes.res);
	}
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
		const initRes = safeDbInit(database)
		if (!initRes.ok) return ctx.fail(new DbError(initRes.error));
		const db = initRes.db;

		try {
			Result.init(
				{ result: DataTypes.TEXT },
				{
					tableName: table,
					freezeTableName: true,
					sequelize: db,
				}
			);
			await Result.sync();
			const result = await Result.findByPk(record);
			if (result) {
				const res = result.get({ plain: true });
				// column name is result
				const parseRes = safeJSONParse(res?.result);
				if (!parseRes.ok) return ctx.fail(new DbError(parseRes.error));
				return ctx.pass(parseRes.parsed);
			} else {
				return ctx.fail(new DbError(`Returned null for id "${record}" in table "${table}"`));
			}
		} catch (e) {
			return ctx.fail(new DbError(e.message));
		} finally {
			db.close();
		}
	}
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
		const initRes = safeDbInit(database)
		if (!initRes.ok) return ctx.fail(new DbError(initRes.error));
		const db = initRes.db;

		try {
			Result.init(
				{ result: DataTypes.TEXT },
				{
					tableName: table,
					freezeTableName: true,
					sequelize: db,
				}
			);
			await Result.sync();
			// column name must be result
			await Result.create({
				result: JSON.stringify({
					[varName]: varObj,
				}),
			});
			return ctx.pass(null);
		} catch (e) {
			return ctx.fail(new DbError(e.message));
		} finally {
			db.close();
		}
	}
);

export const db = p;
