import { getIgnoredStatements } from '@slangroom/ignored';
import { ZenroomParams, zencodeExec } from '@slangroom/shared';
import {
	Plugin,
	ExecParams,
	buildNormalizedPharse,
	EvaluationResult,
	EvaluationResultKind,
} from '@slangroom/core/plugin';
import { lex } from '@slangroom/core/lexer';
import { parse } from '@slangroom/core/parser';
import { visit, type Statement } from '@slangroom/core/visitor';

type Plugins = Plugin | Set<Plugin> | Array<Plugin | Set<Plugin>>;

export class Slangroom {
	#plugins: Plugin[] = [];

	constructor(first: Plugins, ...rest: Plugins[]) {
		const recurse = (x: Plugins) => {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else {
				this.#plugins.push(x);
			}
		};
		[first, ...rest].forEach(recurse);
	}

	async executePlugin(p: Statement, params: ExecParams) {
		const normalizedBuzzwords = buildNormalizedPharse(p.buzzwords)
		let result: EvaluationResult = {
			kind: EvaluationResultKind.Failure,
			error: "No plugin executed",
		}
		for(let plugin of this.#plugins) {
			const bindings = new Map(p.bindings.entries())
			if(p.connect) {
				bindings.set("connect", p.connect)
			}
			result = await plugin.execute(normalizedBuzzwords, bindings, params)
			if(result.kind === EvaluationResultKind.Success) {
				if(p.into) {
					params.set(p.into, result.result)
				}
				break;
			}
		}
		if(result.kind == EvaluationResultKind.Failure) {
			throw new Error(result.error)
		}
	}

	async execute(contract: string, zparams: ZenroomParams) {
		const ignoreds = await getIgnoredStatements(contract, zparams);
		const { givens, thens } = ignoreds.reduce(
			(acc, cur) => {
				const given = cur.split(/^\s*given\s+i\s+/i);
				if (given[1]) {
					acc.givens.push(astify(given[1]));
					return acc;
				}

				const then = cur.split(/^\s*then\s+i\s+/i);
				if (then[1]) acc.thens.push(astify(then[1]));
				return acc;
			},
			{ givens: [] as Statement[], thens: [] as Statement[] }
		);

		const params = new ExecParams(zparams);

		for (const g of givens) {
			await this.executePlugin(g, params)
		}

		const zout = await zencodeExec(contract, {keys: params.getKeys(), data: params.getData()});

		const thenParams = new ExecParams({data: zout.result, keys: params.getKeys()})

		for (const t of thens) {
			await this.executePlugin(t, thenParams)
		}

		return {result: thenParams.getData(), logs: zout.logs};
	}
}

const astify = (line: string) => {
	const { tokens } = lex(line);
	const cst = parse(tokens);
	return visit(cst);
};

