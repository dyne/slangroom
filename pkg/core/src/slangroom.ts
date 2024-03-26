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
		const lexedLines = ignoredLines.map(lex);
		const parsedLines = lexedLines.map((x) => parse(this.#plugins, x));
		parsedLines.forEach((x) => {
			if (x.errors.length) throw new Error(`general errors: ${x.errors.join('\n')}`);
			if (x.matches[0]?.err.length)
				throw new Error(`${x.matches.map((y) => y.err).join('\n')}`);
		});

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
