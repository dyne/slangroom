import type { Jsonable, JsonableObject, ZenroomParams } from '@slangroom/shared';

export class ExecParams {
	#data: JsonableObject;
	#keys: JsonableObject;

	constructor(params: ZenroomParams) {
		this.#data = params.data || {};
		this.#keys = params.keys || {};
	}

	get(key: string): Jsonable | undefined {
		return this.#data[key] ? this.#data[key] : this.#keys[key];
	}

	getThrow(key: string): Jsonable {
		const res = this.#data[key] ? this.#data[key] : this.#keys[key];
		if(!res)
			throw new Error(`Key ${key} not found`)
		return res
	}

	set(key: string, value: Jsonable) {
		this.#data[key] = value;
	}

	getKeys() {
		return this.#keys
	}
	getData() {
		return this.#data
	}
}

export const buildNormalizedPharse = (phrase: string) =>
		phrase.toLowerCase();

export enum EvaluationResultKind {
	Success,
	Failure,
}

export type EvaluationSuccess = {
	kind: EvaluationResultKind.Success,
	result: Jsonable
}

export type EvaluationFailure = {
	kind: EvaluationResultKind.Failure,
	error: any
}
export type EvaluationResult = EvaluationSuccess | EvaluationFailure

export abstract class Plugin {
	#bindings: Map<string, string> = new Map()
	#execParams: ExecParams = new ExecParams({})

	// params: are the optional/mandatory params
	protected buildParams(params: Map<string,boolean>): Map<string, Jsonable> {
		const args = new Map<string, Jsonable>()
		params.forEach((required, param) => {
			const binding = this.#bindings.get(param)
			if(binding) {
				return args.set(param,
					this.#execParams.getThrow(binding || ""))
			} else if(required) {
				throw new Error("Unknown binding")
			}
			return
		})
		return new Map<string, Jsonable>(args)
	}

	async execute(phrase: string, bindings: Map<string, string>,
			execParams: ExecParams) {
		this.#bindings = bindings
		this.#execParams = execParams
		return await this.evaluate(phrase);
	}

	abstract evaluate(phrase: string): Promise<EvaluationResult> | EvaluationResult;
}
