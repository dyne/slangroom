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
import { rdf } from "@slangroom/rdf";
import { redis } from "@slangroom/redis";
import { shell } from "@slangroom/shell";
import { timestamp } from "@slangroom/timestamp";
import { wallet } from "@slangroom/wallet";
import { zencode } from "@slangroom/zencode";

const fullStatementTemplates = [];

const generateStatements = (nameAndPlugin) => {
	const [name, plugin] = nameAndPlugin;
	const p = new Slangroom(plugin).getPlugin();
	p.forEach(([k]) => {
		let openConnect = '';
		let sendParams = '';
		let withParams = '';
		let whereParams = '';
		if (k.openconnect) {
			if (k.openconnect === 'connect') {
				openConnect = `connect to '' and `;
			} else if (k.openconnect === 'open') {
				openConnect = `open '' and `;
			}
		}
		if (k.params) {
			k.params.forEach((param) => {
				sendParams = sendParams.concat(`send ${param} '' and `);
				withParams = withParams.concat(`${param} '', `);
				whereParams = whereParams.concat(`${param} is '', `);
			})
		}

		withParams = withParams.slice(0, -2);
		whereParams = whereParams.slice(0, -2);
		const statement = `I ${openConnect}${sendParams}${k.phrase}`;
		const withStatement = `${openConnect}${k.phrase} with ${withParams}`;
		const whereStatement = `${openConnect}${k.phrase} where ${whereParams}`;
		const lowerCaseStatement = `I ${openConnect}${sendParams.toLowerCase()}${k.phrase.toLowerCase()}`;
		fullStatementTemplates.push(
			{ label: `${name} given ${lowerCaseStatement}`, displayLabel:`Given ${statement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} prepare: ${withStatement.toLowerCase()}`, displayLabel:`Prepare: ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} prepare: ${whereStatement.toLowerCase()}`, displayLabel:`Prepare: ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} then ${lowerCaseStatement}`, displayLabel: `Then ${statement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} compute: ${withStatement.toLowerCase()}`, displayLabel:`Compute: ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} compute: ${whereStatement.toLowerCase()}`, displayLabel:`Compute: ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} given ${lowerCaseStatement} and output into ''`, displayLabel: `Given ${statement} and output into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${name} prepare '': ${withStatement.toLowerCase()}`, displayLabel:`Prepare '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} prepare '': ${whereStatement.toLowerCase()}`, displayLabel:`Prepare '': ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} then ${lowerCaseStatement} and output into ''`, displayLabel: `Then ${statement} and output into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${name} compute '': ${withStatement.toLowerCase()}`, displayLabel:`Compute '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${name} compute '': ${whereStatement.toLowerCase()}`, displayLabel:`Compute '': ${whereStatement}`, type: "keyword", info: `[${name}]` },
		);
	});
}

[
	['db', db],
	['ethereum', ethereum],
	['fs', fs],
	['git', git],
	['helpers', helpers],
	['http', http],
	['JSONSchema', JSONSchema],
	['oauth', oauth],
	['pocketbase', pocketbase],
	['qrcode', qrcode],
	['rdf', rdf],
	['redis', redis],
	['shell', shell],
	['timestamp', timestamp],
	['wallet', wallet],
	['zencode', zencode]
].map((x) => generateStatements(x))

await pfs.writeFile('../src/complete_statement.ts', `export const fullStatementTemplates = ${JSON.stringify(fullStatementTemplates, null, 4)}`, 'utf-8')
