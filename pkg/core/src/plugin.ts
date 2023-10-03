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

export class ReadPlugin {
	#phrase: string;
	#params: string[];
	#func: (...args: Jsonable[]) => Jsonable;

	constructor(phrase: string, params: string[], func: (...args: Jsonable[]) => Jsonable) {
		this.#phrase = phrase;
		this.#params = params
		this.#func = func;
	}

	execute(execParams: ExecParams) {
		const args = this.#params.map((v: any) => execParams.get(v))
		if(args.some(v => v == undefined)) {
			throw new Error("Some arguments are undefined") // TODO: we can do
			// this befone executing the statement
		} else {
			return this.#func(...args.map(v => v || ""))
		}
	}


	getPhrase() {
		return this.#phrase
	}
}
