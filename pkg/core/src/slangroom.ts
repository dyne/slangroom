import { BeforePlugin, AfterPlugin } from '@slangroom/core/plugin';
import { type ZenroomParams, type ZenroomOutput, zencodeExec } from '@slangroom/shared';
import { getIgnoredStatements } from '@slangroom/ignored';

/**
 * A helper type that disallows nested arrays.
 */
type Plugins =
	| BeforePlugin
	| AfterPlugin
	| Set<BeforePlugin | AfterPlugin>
	| Array<BeforePlugin | AfterPlugin | Set<BeforePlugin | AfterPlugin>>;

/**
 * A Slangroom instance.
 */
export class Slangroom {
	/**
	 * A set of plugins that needs to be executed **before** the actual Zenroom execution.
	 */
	private _beforeExecution = new Set<BeforePlugin>();
	get beforeExecution() {
		return this._beforeExecution;
	}

	/**
	 * A set of plugins that needs to be executed **after** the actual Zenroom execution.
	 */
	private _afterExecution = new Set<AfterPlugin>();
	get afterExecution() {
		return this._afterExecution;
	}

	constructor(first: Plugins, ...rest: Plugins[]) {
		this.addPlugins(first, ...rest);
	}

	/**
	 * Adds a single or a list of plugins to the Slangroom instance.
	 */
	addPlugins(first: Plugins, ...rest: Plugins[]) {
		const plugins = new Set<BeforePlugin | AfterPlugin>();
		[first, ...rest].forEach(function recurse(x: Plugins) {
			if (Array.isArray(x) || x instanceof Set) x.forEach(recurse);
			else plugins.add(x);
		});

		for (const p of plugins) {
			if (p instanceof BeforePlugin) this._beforeExecution.add(p);
			if (p instanceof AfterPlugin) this._afterExecution.add(p);
		}
	}

	/**
	 * Executes a contract using optional parameters with custom statements.
	 */
	async execute(contract: string, params?: ZenroomParams): Promise<ZenroomOutput> {
		const ignoreds = await getIgnoredStatements(contract, params);
		params = params || {data: {}}

		// TODO: remove the statements when they match (decide how)
		for (const ignored of ignoreds) {
			for (const b of this._beforeExecution) {
				const res = await b.execute({
					statement: ignored,
					params: params,
				})
				params.data = Object.assign(params.data || {}, res)
			}
		}

		const zout = await zencodeExec(contract, params);

		for (const ignored of ignoreds) {
			for (const a of this._afterExecution) {
				const res = await a.execute({
					statement: ignored,
					result: zout.result,
					params: params,
				})
				zout.result = Object.assign(zout.result || {}, res)
			}
		}

		return zout;
	}
}
