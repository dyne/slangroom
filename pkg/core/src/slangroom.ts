import { getIgnoredStatements } from '@slangroom/ignored';
import { ZenroomParams, zencodeExec } from '@slangroom/shared';
import {
	Plugin,
	ExecContext,
	ExecParams,
	ReadPlugin,
	SavePlugin,
	ConnectPlugin,
} from '@slangroom/core/plugin';
import { lex } from '@slangroom/core/lexer';
import { parse } from '@slangroom/core/parser';
import { StatementType, visit, type Statement } from '@slangroom/core/visitor';

type Plugins = Plugin | Set<Plugin> | Array<Plugin | Set<Plugin>>;

export class Slangroom {
	#readPlugins = new Set<ReadPlugin>();
	#savePlugins = new Set<SavePlugin>();
	#connectPlugins = new Set<ConnectPlugin>();

	constructor(first: Plugins, ...rest: Plugins[]) {
		const recurse = (x: Plugins) => {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else {
				if (x instanceof ReadPlugin) this.#readPlugins.add(x);
				if (x instanceof SavePlugin) this.#savePlugins.add(x);
				if (x instanceof ConnectPlugin) this.#connectPlugins.add(x);
			}
		};
		[first, ...rest].forEach(recurse);
	}

	async execute(contract: string, zparams: ZenroomParams) {
		const ignoreds = await getIgnoredStatements(contract, zparams);
		const { givens, whens, thens } = ignoreds.reduce(
			(acc, cur) => {
				const given = cur.split(/^\s*given\s+i\s+/i);
				if (given[1]) {
					acc.givens.push(astify(given[1]));
					return acc;
				}

				const when = cur.split(/^\s*when\s+i\s+/i);
				if (when[1]) {
					acc.whens.push(astify(when[1]));
					return acc;
				}

				const then = cur.split(/^\s*when\s+i\s+/i);
				if (then[1]) acc.thens.push(astify(then[1]));
				return acc;
			},
			{ givens: [] as Statement[], whens: [] as Statement[], thens: [] as Statement[] }
		);

		const params = new ExecParams(zparams);
		const ctx = new ExecContext();

		for (const [i, g] of givens.entries()) {
			if (g.type == StatementType.Connect) {
				const connectPlugin = [...this.#connectPlugins].find((x) => x.match(g.connect));
				if (!connectPlugin) continue;
				givens.splice(i, 1);
				connectPlugin.execute(params, ctx);
			} else if (g.type === StatementType.Read) {
				const readPlugin = [...this.#readPlugins].find((x) => x.match(g.read));
				if (!readPlugin) continue;
				givens.splice(i, 1);
				readPlugin.execute(params, ctx);
			} else if (g.type === StatementType.ReadAndSave) {
				const readPlugin = [...this.#readPlugins].find((x) => x.match(g.read));
				if (!readPlugin) continue;
				const savePlugin = [...this.#savePlugins].find((x) => x.match(g.save));
				if (!savePlugin) continue;
				// TODO: somehow link theso two: make execute() return a
				// JsonableObject
				readPlugin.execute(params, ctx);
				savePlugin.execute(params);
			} else if (g.type === StatementType.ReadInto) {
				const readPlugin = [...this.#readPlugins].find((x) => x.match(g.read));
				if (!readPlugin) continue;
				// const into = g.into;
				// TODO: use `into` with `params`
				givens.splice(i, 1);
				readPlugin.execute(params, ctx);
			} else if (g.type === StatementType.ReadIntoWithin) {
				const readPlugin = [...this.#readPlugins].find((x) => x.match(g.read));
				if (!readPlugin) continue;
				// const into = g.into;
				// const within = g.within;
				// TODO: use `into` with `params`
				givens.splice(i, 1);
				readPlugin.execute(params, ctx);
			}
		}

		for (const w of whens) {
			for (const p of this.#plugins) {
				if (p.match(w)) p.execute(ctx);
			}
		}

		const zout = await zencodeExec(contract, params);

		for (const t of thens) {
			for (const p of this.#plugins) {
				if (p.match(t)) p.execute(ctx);
			}
		}

		return zout;
	}
}

const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};
