// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getIgnoredStatements } from '@slangroom/ignored';
import { type ZenOutput, ZenParams, zencodeExec } from '@slangroom/shared';
import { lex, parse, visit, Plugin, PluginMap, PluginContextImpl } from '@slangroom/core';

/**
 * Just a utility type to ease typing.
 */
export type Plugins = Plugin | Plugin[];

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
		const paramsGiven = requirifyZenParams(optParams);
		const ignoredLines = await getIgnoredStatements(contract, paramsGiven);
		const lexedLines = ignoredLines.map((ignored) => lex(...ignored));
		const parsedLines = lexedLines.map((lexed) => parse(this.#plugins, ...lexed));
		const errs = parsedLines
			.flatMap((x) => [...x.errors, ...(x.matches[0]?.err ?? [])])
			.join('\n');
		if (errs.length) thorwErrors(errs, contract);

		const cstGivens = parsedLines.filter((x) => x.givenThen === 'given');
		for (const cst of cstGivens) {
			const ast = visit(cst, paramsGiven);
			const exec = this.#plugins.get(ast.key);
			if (!exec) throw new Error('no statements matched');
			const res = await exec(new PluginContextImpl(ast));
			if (!res.ok) throw new Error(res.error);
			if (res.ok && ast.into) paramsGiven.data[ast.into] = res.value;
		}

		const zout = await zencodeExec(contract, paramsGiven);
		const paramsThen: ZenParams = { data: zout.result, keys: paramsGiven.keys };

		const cstThens = parsedLines.filter((x) => x.givenThen === 'then');
		for (const cst of cstThens) {
			const ast = visit(cst, paramsThen);
			const exec = this.#plugins.get(ast.key);
			if (!exec) throw new Error('no statements matched');
			const res = await exec(new PluginContextImpl(ast));
			if (!res.ok) throw new Error(res.error);
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

// first draft of improved error throwing starting from a parseError
// TODO: move the retireve of errorLine and errorColumns out of this function
// TODO: some problems raised in case of use of tabs in the contract
//       maybe to be converted into all spaces at the beginning
// TODO: make it working with all type of errors in slangroom
const thorwErrors = (error: string, contract: string) => {
	const contractLines = contract.split('\n');
	const lc = error.match(/\d+:\d+-\d+/) || ['1:1-1'];
	const [ line, col ] = lc[0].split(':');
	const lineNumber = Number(line);
	const colStart = Number(col!.split('-')[0]);
	const colEnd = Number(col!.split('-')[1]);
	const lineStart = lineNumber > 2 ? lineNumber - 2 : 0;
	const lineEnd = lineNumber + 2 > contractLines.length ? contractLines.length : lineNumber + 2;
	let e = "";
	for (let i = lineStart; i < lineEnd; i++) {
		const linePrefix = `${i} | `;
		e = e.concat(`\x1b[33m${linePrefix}\x1b[0m${contractLines[i]}\n`);
		if (i === lineNumber -1) {
			const cLine = contractLines[i] || '';
			const initialWS = cLine.match(/^[\s\t]+/) || [''];
			// tabs includes lineprefix
			const linePrefixLength = cLine.search(/\t/) >= 0 ? 0 : linePrefix.length;
			e = e.concat(initialWS[0], ' '.repeat(colStart - 1 + linePrefixLength) + '\x1b[31m' + '^'.repeat(colEnd - colStart + 1) + '\x1b[0m', '\n');
		}
	}
	e = e.concat(error)
	console.log(e)
	throw new Error(e);
}
