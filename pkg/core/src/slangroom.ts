//import { getIgnoredStatements } from '@slangroom/ignored';
import { ZenroomParams, zencodeExec } from '@slangroom/shared';
import {
	ExecParams,
	ReadPlugin,
} from '@slangroom/core/plugin';
//import { lex } from '@slangroom/core/lexer';
//import { parse } from '@slangroom/core/parser';
//import { visit, type Statement } from '@slangroom/core/visitor';

type Plugins = Plugin | Set<Plugin> | Array<Plugin | Set<Plugin>>;

export class Slangroom {
	#readPlugins = new Map<string, ReadPlugin>();

	constructor(first: Plugins, ...rest: Plugins[]) {
		const recurse = (x: Plugins) => {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else {
				if (x instanceof ReadPlugin) this.#readPlugins.set(x.getPhrase(), x);
			}
		};
		[first, ...rest].forEach(recurse);
	}

	async execute(contract: string, zparams: ZenroomParams) {
		//const ignoreds = await getIgnoredStatements(contract, zparams);
		/*const { givens, thens } = ignoreds.reduce(
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
		);*/

		const params = new ExecParams(zparams);

		/*for (const [i, g] of givens.entries()) {
		}*/

		const zout = await zencodeExec(contract, {keys: params.getKeys(), data: params.getData()});

		/*for (const t of thens) {
			for (const p of this.#plugins) {
				if (p.match(t)) p.execute(ctx);
			}
		}*/

		return zout;
	}
}

/*const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};*/
