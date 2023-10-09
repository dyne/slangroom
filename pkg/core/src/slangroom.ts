import { getIgnoredStatements } from '@slangroom/ignored';
import { type ZenOutput, ZenParams, zencodeExec } from '@slangroom/shared';
import {
	lex,
	parse,
	visit,
	PluginContextImpl,
	type Plugin,
	type StatementCst,
	type Statement,
} from '@slangroom/core';

type Plugins = Plugin | Set<Plugin> | Array<Plugin | Set<Plugin>>;

export class Slangroom {
	#plugins = new Set<Plugin>();

	constructor(first: Plugins, ...rest: Plugins[]) {
		const recurse = (x: Plugins) => {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else this.#plugins.add(x);
		};
		[first, ...rest].forEach(recurse);
	}

	async execute(contract: string, optParams?: Partial<ZenParams>): Promise<ZenOutput> {
		const zparams = requirifyZenParams(optParams);
		const givens: Statement[] = [];
		const thens: Statement[] = [];
		const ignoreds = await getIgnoredStatements(contract, zparams);
		ignoreds.forEach((x: string) => {
			const given = x.split(/^\s*given\s+i\s+/i);
			if (given[1]) {
				const { ast, errors } = astify(given[1]);
				if (!ast) throw errors;
				givens.push(ast);
				return;
			}

			const then = x.split(/^\s*then\s+i\s+/i);
			if (then[1]) {
				const { ast, errors } = astify(then[1]);
				if (!ast) throw errors;
				thens.push(ast);
			}
		});

		for (const g of givens) await this.#execute(g, zparams);

		const zout = await zencodeExec(contract, zparams);

		const params: ZenParams = { data: zout.result, keys: zparams.keys };
		for (const t of thens) await this.#execute(t, params);

		return { result: params.data, logs: zout.logs };
	}

	async #execute(stmt: Statement, zparams: ZenParams) {
		const ctx = new PluginContextImpl(stmt, zparams);
		for (const p of this.#plugins) {
			const result = await p(ctx);
			if (result.ok) {
				if (stmt.into) zparams.data[stmt.into] = result.value;
				return;
			}
		}
		throw new Error('no statements matched');
	}
}

const requirifyZenParams = (params?: Partial<ZenParams>): Required<ZenParams> => {
	if (!params) return { data: {}, keys: {} };
	if (!params.data) params.data = {};
	if (!params.keys) params.keys = {};
	return params as ZenParams;
};

export const astify = (line: string) => {
	const lexed = lex(line);
	if (lexed.errors.length) return { errors: lexed.errors };
	const parsed = parse(lexed.tokens);
	if (parsed.errors.length) return { errors: parsed.errors };
	return { ast: visit(parsed.cst as StatementCst) };
};
