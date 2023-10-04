import type { Jsonable, JsonableObject, ZenroomParams } from '@slangroom/shared';

export class ExecContext {
	#store = new Map<any, any>();

	get(key: any): any {
		return this.#store.get(key);
	}

	set(key: any, value: any) {
		this.#store.set(key, value);
	}
}

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

export class Plugin {
	#params: string[];
	constructor(params: string[]) {
		this.#params = params
	}

	protected buildParams(bindings: Map<string, string>, execParams: ExecParams): Jsonable[] {
		const args = this.#params.map((v: any) => {
			const binding = bindings.get(v)
			if(binding) {
				return execParams.getThrow(binding || "")
			} else {
				throw new Error("Unknown binding")
			}
		})
		return args
	}
}

export class ReadPlugin extends Plugin {
	#phrase: string;
	#func: (...args: Jsonable[]) => Jsonable;

	constructor(phrase: string, params: string[], func: (...args: Jsonable[]) => Jsonable) {
		super(params);
		this.#phrase = phrase;
		this.#func = func;
	}

	execute(bindings: Map<string, string>, execParams: ExecParams) {
		const args = this.buildParams(bindings, execParams)
		return this.#func(...args)
	}


	getPhrase() {
		return this.#phrase
	}
}
