// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getIgnoredStatements } from '@slangroom/ignored';
import { type ZenOutput, ZenParams, zencodeExec } from '@slangroom/shared';
import { lex, parse, visit, Plugin, PluginMap, PluginContextImpl } from '@slangroom/core';
import {
	sentenceHighlight,
	textHighlight,
	errorColor,
	suggestedColor,
	missingColor,
	extraColor,
	lineNoColor
} from '@slangroom/shared';

/**
 * Just a utility type to ease typing.
 */
export type Plugins = Plugin | Plugin[];

type GenericError = {
	message: Error,
	lineNo: number,
	start?: number,
	end?: number
}
/**
 * The entrypoint to the Slangroom software.
 *
 * @example
 * ```ts
 * import {http} from "@slangroom/http";
 * import {git} from "@slangroom/git";
 *
 * const sl = new Slangroom(http, git);
 * const {result, logs} = sl.execute(contractWithCustomStatements, zenroomParameters)
 * ```
 */
export class Slangroom {
	/**
	 * The datastore that stores our plugins.
	 */
	#plugins = new PluginMap();

	/**
	 * Creates an instance of {@link Slangroom}.
	 *
	 * @param first A plugin or list of it.
	 * @param rest A plugin or list of it, spreaded.
	 *
	 * @throws {@link @slangroom/core/plugin#DuplicatePluginError}
	 * If any of the plugin definitions have duplicates.
	 */
	constructor(first: Plugins, ...rest: Plugins[]) {
		const p = this.#plugins;
		[first, ...rest].forEach(function recurse(x) {
			if (Array.isArray(x)) x.forEach(recurse);
			else x.store.forEach(([k, v]) => p.set(k, v));
		});
	}

	/**
	 * Executes a given contract with parameters using the list of plugins
	 * provided at the class ininitation.
	 *
	 * @param contract The Zenroom contract with optional custom statements.
	 * @param optParams The Zenroom parameters to be supplied.
	 *
	 * @returns The output of Zenroom execution along with custom executors
	 * applied to it (before or after).
	 *
	 * @throws {@link Error}
	 * If there exists any general errors of the parsed lines.
	 *
	 * @throws {@link Error}
	 * If there exists any errors on any matches.
	 *
	 * @throws {@link Error}
	 * If no plugin definitions can be matched against a custom statement.
	 */
	async execute(contract: string, optParams?: Partial<ZenParams>): Promise<ZenOutput> {
		// substitute all tabs with 4 spaces in contract for better error reporting
		contract = contract.replaceAll('\t', '    ');
		const paramsGiven = requirifyZenParams(optParams);
		const { ignoredLines, invalidLines } = await getIgnoredStatements(contract);
		if (typeof invalidLines[0] !== "undefined") {thorwErrors(invalidLines, contract)}
		// lex
		const lexedResult = ignoredLines.map((ignored) => lex(...ignored));
		const lexedErrors = lexedResult.flatMap((x) => {if (!x.ok) return x.error; return [];});
		if (typeof lexedErrors[0] !== "undefined") thorwErrors(lexedErrors, contract);
		const lexedLines = lexedResult.flatMap((x) => {if(x.ok) return [x.value]; return [];});
		// parse
		const parsedLines = lexedLines.map((lexed) => parse(this.#plugins, ...lexed));
		const parsedErrors = parsedLines.flatMap((x) => [...x.errors, ...(x.matches[0]?.err ?? [])])
		if (typeof parsedErrors[0] !== "undefined") thorwErrors(parsedErrors, contract);

		const cstGivens = parsedLines.filter((x) => x.givenThen === 'given');
		for (const cst of cstGivens) {
			const { ast, lineNo } = visit(cst, paramsGiven);
			const exec = this.#plugins.get(ast.key);
			if (!exec) return thorwErrors( [{message: new Error('no statements matched'), lineNo}], contract);
			const res = await exec(new PluginContextImpl(ast));
			if (!res.ok) return thorwErrors( [{message: res.error, lineNo}], contract);
			if (res.ok && ast.into) paramsGiven.data[ast.into] = res.value;
		}

		const zout = await zencodeExec(contract, paramsGiven);
		const paramsThen: ZenParams = { data: zout.result, keys: paramsGiven.keys };

		const cstThens = parsedLines.filter((x) => x.givenThen === 'then');
		for (const cst of cstThens) {
			const { ast, lineNo } = visit(cst, paramsThen);
			const exec = this.#plugins.get(ast.key);
			if (!exec) return thorwErrors( [{message: new Error('no statements matched'), lineNo}], contract);
			const res = await exec(new PluginContextImpl(ast));
			if (!res.ok) return thorwErrors( [{message: res.error, lineNo}], contract);
			if (res.ok && ast.into) paramsThen.data[ast.into] = res.value;
		}

		// remove null values from output
		Object.keys(paramsThen.data).forEach(k => (paramsThen.data[k] == null) && delete paramsThen.data[k]);
		return { result: paramsThen.data, logs: zout.logs };
	}

	getPlugin() {
		return this.#plugins
	}
}

/**
 * Converts a partial {@link ZenParams} into a required {@link ZenParams}.
 */
const requirifyZenParams = (params?: Partial<ZenParams>): Required<ZenParams> => {
	if (!params) return { data: {}, keys: {}, conf: '', extra: {} };
	if (!params.data) params.data = {};
	if (!params.keys) params.keys = {};
	return { extra: {}, conf: '', ...params } as Required<ZenParams>;
};

/**
 * Print Error in a pretty way
 * @param error {message, lineNo, ?start, ?end}
 * @param contract {string}
*/
const thorwErrors = (errorArray: GenericError[], contract: string) => {
	const contractLines = contract.split('\n');
	const lineNumber = errorArray[0]!.lineNo;
	const initialWS = contractLines[lineNumber-1]!.match(/^[\s]+/) || [''];
	const colStart = errorArray[0]!.start ? errorArray[0]!.start+initialWS[0].length : initialWS[0].length;
	const colEnd = errorArray[0]!.end ? errorArray[0]!.end+1+initialWS[0].length : contractLines[lineNumber-1]!.length;
	const lineStart = lineNumber > 2 ? lineNumber - 2 : 0;
	const lineEnd = lineNumber + 2 > contractLines.length ? contractLines.length : lineNumber + 2;
	let e = "";
	for (let i = lineStart; i < lineEnd; i++) {
		const linePrefix = `${i} | `;
		if (i === lineNumber -1) {
			let boldError = textHighlight(contractLines[i]!.slice(colStart, colEnd));
			const redBackground = sentenceHighlight(contractLines[i]!.slice(0, colStart) + boldError + contractLines[i]!.slice(colEnd));
			e = e.concat(`${lineNoColor(linePrefix)}${redBackground}\n`);
			e = e.concat(' '.repeat(colStart + linePrefix.length) + errorColor('^'.repeat(colEnd - colStart)) + '\n');
		} else { e = e.concat(`${lineNoColor(linePrefix)}${contractLines[i]}\n`); }
	}
	e = e.concat('\n' + 'Error colors:\n');
	e = e.concat(` - ${errorColor('error')}\n`);
	e = e.concat(` - ${suggestedColor('suggested words')}\n`);
	e = e.concat(` - ${missingColor('missing words')}\n`);
	e = e.concat(` - ${extraColor('extra words')}\n`);

	for (let err of errorArray) {
		e = e.concat('\n' + err.message + '\n');
	}
	throw new Error(e);
}
