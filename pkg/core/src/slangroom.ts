import { getIgnoredStatements } from '@slangroom/ignored';
import { ZenroomParams, zencodeExec } from '@slangroom/shared';
import {
	Plugin,
	ExecParams,
	buildNormalizedPharse,
} from '@slangroom/core/plugin';
import { lex } from '@slangroom/core/lexer';
import { parse } from '@slangroom/core/parser';
import { visit, type Statement } from '@slangroom/core/visitor';

type Plugins = Plugin | Set<Plugin> | Array<Plugin | Set<Plugin>>;

export class Slangroom {
	#plugins = new Map<string, Plugin>();

	constructor(first: Plugins, ...rest: Plugins[]) {
		const recurse = (x: Plugins) => {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else {
				this.#plugins.set(x.getPhrase(), x);
			}
		};
		[first, ...rest].forEach(recurse);
	}

	async executePlugin(p: Statement, params: ExecParams) {
		const normalizedBuzzwords = buildNormalizedPharse(p.buzzwords)
		const plugin = this.#plugins.get(normalizedBuzzwords)
		if(plugin) {
			const result = plugin.execute(p.bindings, params)
			if(p.into) {
				params.set(p.into, result)
			}
		} else {
			throw new Error("Unknown phrase")
		}
	}

	async execute(contract: string, zparams: ZenroomParams) {
		const ignoreds = await getIgnoredStatements(contract, zparams);
		const { givens, thens } = ignoreds.reduce(
			(acc, cur) => {
				const given = cur.split(/^\s*given\s+i\s+/i);
				if (given[1]) {
					acc.givens = acc.givens.concat(astify(given[1]));
					return acc;
				}

				const then = cur.split(/^\s*then\s+i\s+/i);
				if (then[1]) acc.thens = acc.thens.concat(astify(then[1]));
				return acc;
			},
			{ givens: [] as Statement[], thens: [] as Statement[] }
		);

		const params = new ExecParams(zparams);

		for (const g of givens) {
			this.executePlugin(g, params)
		}

		const zout = await zencodeExec(contract, {keys: params.getKeys(), data: params.getData()});

		const thenParams = new ExecParams({data: zout.result, keys: params.getKeys()})

		for (const t of thens) {
			this.executePlugin(t, thenParams)
		}

		return {result: thenParams.getData(), logs: zout.logs};
	}
}

const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};
