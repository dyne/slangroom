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

const reservedWords = new Set([
	'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
	'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try',
	'typeof', 'var', 'void', 'while', 'with', 'yield', 'enum', 'await', 'implements', 'interface', 'let', 'package', 'private',
	'protected', 'public', 'static'
]);

function isReservedWord(word) {
	if (reservedWords.has(word)) return true;
	try {
		new Function(`var ${word};`);
		return false;
	} catch {
		return true;
	}
}

function prepareTokens(name){
	if (isReservedWord(name)) {
		importTokens += `\t_${name},\n`;
		keyWordMaps += `\t${name}: _${name},\n`;
	} else {
		importTokens += `\t${name},\n`;
		keyWordMaps += `\t${name},\n`;
	}
}

let importTokens = '';
let keyWordMaps = '';
const fullStatementTemplates = [];
// preset of world that are external to the core of slangroom statements
const words = [
	'given', 'then', 'I', 'prepare', 'compute', 'open', 'connect', 'to', 'send', 'and', 'where', 'is', 'with', 'output', 'secret', 'into', // slangroom
	'scenario', 'rule', 'version', 'unknown', 'ignore', // begin of contract
	'when', 'foreach', 'endforeach', 'if', 'endif', // zencode start of sentences different from given and then
	'that', 'have', 'a', 'my', 'the', 'valid', 'named', 'in', 'inside', 'am', 'name', 'known', 'as', 'verify', 'print' //usefull zencode keywords
];

let pluginSpecificStatements = '';
let statementsGt = '';
let statementsPc = '';

const permutations = (arr) => {
	if (arr.length <= 1) return [arr];

	const result = [];
	for (let i = 0; i < arr.length; i++) {
		const current = arr[i];
		const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
		const perms = permutations(remaining);
		for (const perm of perms) {
			result.push([current, ...perm]);
		}
	}
	return result;
}

const generateStatements = (nameAndPlugin) => {
	const [name, plugin] = nameAndPlugin;
	const nameLowerCase = name.toLowerCase();
	const p = new Slangroom(plugin).getPlugin();
	const pluginStatement = `${name}Statement`;
	const pluginStatementsTableGt = [];
	const pluginStatementsTablePc = [];
	p.forEach(([k]) => {
		let openConnect = '';
		let sendParams = '';
		let withParams = '';
		let whereParams = '';
		let statementGrammarGt = '';
		let statementGrammarPc = '';
		if (k.openconnect) {
			if (k.openconnect === 'connect') {
				openConnect = `connect to '' and `;
				statementGrammarPc = statementGrammarGt = `connect to StringLiteral and `;
			} else if (k.openconnect === 'open') {
				openConnect = `open '' and `;
				statementGrammarPc = statementGrammarGt = `open StringLiteral and `;
			}
		}


		statementGrammarPc += `Action<${k.phrase}>`;
		let sends = [];
		let whereWith = [];
		if (k.params) {
			statementGrammarPc += ` (with | where)`;
			if (k.params.length > 1) {
				statementGrammarGt += `( `;
				statementGrammarPc += `(`;
			}
			k.params.forEach((param) => {
				if (!words.includes(param)) words.push(param);
				sends.push(`send ${param} StringLiteral and `);
				whereWith.push(` ${param} is? StringLiteral`);
				sendParams += `send ${param} '' and `;
				withParams += `${param} '', `;
				whereParams += `${param} is '', `;
			})
			statementGrammarGt += permutations(sends).map((perm) => perm.join('')).join('|');
			statementGrammarPc += permutations(whereWith).map((perm) => perm.join('","')).join('|');
			if (k.params.length > 1) {
				statementGrammarGt += `) `;
				statementGrammarPc += `) `;
			}
		}
		statementGrammarGt += `Action<${k.phrase}> SaveAction?`;
		k.phrase.split(' ').filter(w => w !== "''" && !words.includes(w)).forEach((w) => words.push(w));
		pluginStatementsTableGt.push(statementGrammarGt);
		pluginStatementsTablePc.push(statementGrammarPc);

		const statement = `I ${openConnect}${sendParams}${k.phrase}`;
		const withStatement = `${openConnect}${k.phrase}${withParams !== '' ? ` with ${withParams.slice(0, -2)}` : ''}`;
		const whereStatement = `${openConnect}${k.phrase}${whereParams !== '' ? ` where ${whereParams.slice(0, -2)}` : ''}`;
		const lowerCaseStatement = `I ${openConnect}${sendParams.toLowerCase()}${k.phrase.toLowerCase()}`;
		fullStatementTemplates.push(
			{ label: `${nameLowerCase} given ${lowerCaseStatement}`, displayLabel: `Given ${statement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare: ${withStatement.toLowerCase()}`, displayLabel: `Prepare: ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare: ${whereStatement.toLowerCase()}`, displayLabel: `Prepare: ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} then ${lowerCaseStatement}`, displayLabel: `Then ${statement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute: ${withStatement.toLowerCase()}`, displayLabel: `Compute: ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute: ${whereStatement.toLowerCase()}`, displayLabel: `Compute: ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} given ${lowerCaseStatement} and output into ''`, displayLabel: `Given ${statement} and output into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare '': ${withStatement.toLowerCase()}`, displayLabel: `Prepare '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare '': ${whereStatement.toLowerCase()}`, displayLabel: `Prepare '': ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} then ${lowerCaseStatement} and output into ''`, displayLabel: `Then ${statement} and output into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute '': ${withStatement.toLowerCase()}`, displayLabel: `Compute '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute '': ${whereStatement.toLowerCase()}`, displayLabel: `Compute '': ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} given ${lowerCaseStatement} and output secret into ''`, displayLabel: `Given ${statement} and output secret into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare secret '': ${withStatement.toLowerCase()}`, displayLabel: `Prepare secret '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} prepare secret '': ${whereStatement.toLowerCase()}`, displayLabel: `Prepare secret '': ${whereStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} then ${lowerCaseStatement} and output secret into ''`, displayLabel: `Then ${statement} and output secret into ''`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute secret '': ${withStatement.toLowerCase()}`, displayLabel: `Compute secret '': ${withStatement}`, type: "keyword", info: `[${name}]` },
			{ label: `${nameLowerCase} compute secret '': ${whereStatement.toLowerCase()}`, displayLabel: `Compute secret '': ${whereStatement}`, type: "keyword", info: `[${name}]` }
		);
	});
	pluginSpecificStatements += `\nGt${pluginStatement} {\n    ${pluginStatementsTableGt.join(' |\n    ')}\n}`;
	pluginSpecificStatements += `\nPc${pluginStatement} {\n    ${pluginStatementsTablePc.join(' |\n    ')}\n}`;
	statementsGt += `Gt${pluginStatement} |`;
	statementsPc += `Pc${pluginStatement} |`;
}

[
	['Db', db],
	['Ethereum', ethereum],
	['Fs', fs],
	['Git', git],
	['Helpers', helpers],
	['Http', http],
	['JsonSchema', JSONSchema],
	['OAuth', oauth],
	['Pocketbase', pocketbase],
	['QrCode', qrcode],
	['Rdf', rdf],
	['Redis', redis],
	['Shell', shell],
	['Timestamp', timestamp],
	['Wallet', wallet],
	['Zencode', zencode]
].forEach((x) => generateStatements(x))

let tokens = '    ';
let keywords = '    ';
for (const w of words) {
	tokens += `${w}[@name=${w}], `;
	keywords += `${w} | `;
	prepareTokens(w);
}

await pfs.writeFile('../src/complete_statement.ts', `export const fullStatementTemplates = ${JSON.stringify(fullStatementTemplates, null, 4)}`, 'utf-8')
const syntaxGrammar = await pfs.readFile('./syntax.grammar.template', 'utf-8');
await pfs.writeFile(
	'../src/syntax.grammar',
	syntaxGrammar
		.replace("{{ Plugin-Specific Statements }}", pluginSpecificStatements)
		.replace("{{ GtStatements }}", statementsGt.slice(0, -2))
		.replace("{{ PcStatements }}", statementsPc.slice(0, -2))
		.replace("{{ External-Tokens }}", tokens.slice(0, -2))
		.replace("{{ Keywords }}", keywords.slice(0, -2)),
	'utf-8');
const tokensFile = await pfs.readFile('./tokens.template', 'utf-8');
await pfs.writeFile(
	'../src/tokens.js',
	tokensFile
		.replace("{{ tokens }}", importTokens.slice(0, -1))
		.replace("{{ keywordMap }}", keyWordMaps.slice(0, -1)),
	'utf-8');
