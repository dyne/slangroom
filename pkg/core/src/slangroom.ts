import { getIgnoredStatements } from '@slangroom/ignored';
import { type ZenOutput, ZenParams, zencodeExec } from '@slangroom/shared';
import { lex, parse, visit, Plugin, PluginMap, PluginContextImpl } from '@slangroom/core';

export type Plugins = Plugin | Plugin[];

export class Slangroom {
	#plugins = new PluginMap();

	constructor(first: Plugins, ...rest: Plugins[]) {
		const p = this.#plugins;
		[first, ...rest].forEach(function recurse(x) {
			if (Array.isArray(x)) x.forEach(recurse);
			else x.store.forEach(([k, v]) => p.set(k, v));
		});
	}

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
			if (res.ok && ast.into) paramsThen.data[ast.into] = res.value;
		}

		return { result: paramsThen.data, logs: zout.logs };
	}
}

const requirifyZenParams = (params?: Partial<ZenParams>): Required<ZenParams> => {
	if (!params) return { data: {}, keys: {}, conf: '', extra: {} };
	if (!params.data) params.data = {};
	if (!params.keys) params.keys = {};
	return { extra: {}, conf: '', ...params } as Required<ZenParams>;
};
