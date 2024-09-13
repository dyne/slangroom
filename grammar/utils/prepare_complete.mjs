// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { promises as pfs } from 'fs';

// slangroom
import { Slangroom } from "@slangroom/core";

// packages
import { db } from "@slangroom/db";
import { ethereum } from "@slangroom/ethereum";
import { fs } from "@slangroom/fs";
import { git } from "@slangroom/git";
import { helpers } from "@slangroom/helpers";
import { http } from "@slangroom/http";
import { JSONSchema } from "@slangroom/json-schema";
import { oauth } from "@slangroom/oauth";
import { pocketbase } from "@slangroom/pocketbase";
import { qrcode } from "@slangroom/qrcode";
import { redis } from "@slangroom/redis";
import { shell } from "@slangroom/shell";
import { timestamp } from "@slangroom/timestamp";
import { wallet } from "@slangroom/wallet";
import { zencode } from "@slangroom/zencode";

const fullStatementTemplates = [];

const generateStatements = (plugin) => {
	const p = new Slangroom(plugin).getPlugin()
	p.forEach(([k]) => {
		let openConnect = '';
		let params = '';
		if (k.openconnect) {
			openConnect = k.openconnect == 'connect' ? `connect to '' and ` : `open '' and `;
		}
		if (k.params) {
			k.params.forEach((param) => {
				params = params.concat(`send ${param} '' and `);
			})
		}
		const statement = `I ${openConnect}${params}${k.phrase}`;
		fullStatementTemplates.push(
			{ label: `Given ${statement}`, type: "keyword" },
			{ label: `Then ${statement}`, type: "keyword" },
			{ label: `Given ${statement} and output into ''`, type: "keyword" },
			{ label: `Then ${statement} and output into ''`, type: "keyword" }
		);
	});
}

[
	db,
	ethereum,
	fs,
	git,
	helpers,
	http,
	JSONSchema,
	oauth,
	pocketbase,
	qrcode,
	redis,
	shell,
	timestamp,
	wallet,
	zencode
].map(x => generateStatements(x))

await pfs.writeFile('../src/complete_statement.ts', `export const fullStatementTemplates = ${JSON.stringify(fullStatementTemplates, null, 4)}`, 'utf-8')
