import type { Jsonable, JsonableObject, ZenroomParams } from '@slangroom/shared';
import { Action } from '@slangroom/core/visitor';

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

	contsructor(params: ZenroomParams) {
		this.#data = params.data || {};
		this.#keys = params.keys || {};
	}

	get(key: string): Jsonable | undefined {
		return this.#data[key] ? this.#data[key] : this.#keys[key];
	}

	set(key: string, value: Jsonable) {
		this.#data[key] = value;
	}
}

export abstract class Plugin {
	#phrase: string;

	constructor(phrase: string) {
		this.#phrase = phrase.toLowerCase();
	}

	match(actn: Action) {
		return actn.phrase.toLowerCase() === this.#phrase;
	}

	abstract execute(params: ExecParams, ctx: ExecContext): void | Promise<void>;
}

export class ConnectPlugin extends Plugin {
	#execute: (params: ExecParams, ctx: ExecContext) => void;
	constructor(phrase: string, cb: (params: ExecParams, ctx: ExecContext) => void) {
		super(phrase);
		// TODO: using `phrase`, fetch all the variables and put them inside
		// `ExecParams`.
		this.#execute = cb;
	}

	execute(params: ExecParams, ctx: ExecContext) {
		this.#execute(params, ctx);
	}
}

export class ReadPlugin extends Plugin {
	#execute: (params: ExecParams, ctx: ExecContext) => void;

	constructor(phrase: string, cb: (params: ExecParams, ctx: ExecContext) => void) {
		super(phrase);
		// TODO: using `phrase`, fetch all the variables and put them inside
		// `ExecParams`.
		this.#execute = cb;
	}

	execute(params: ExecParams, ctx: ExecContext) {
		this.#execute(params, ctx);
	}
}

export class IntoPlugin extends Plugin {
	#execute: (params: ExecParams) => void;

	constructor(phrase: string, cb: (params: ExecParams) => void) {
		super(phrase);
		// TODO: using `phrase`, fetch all the variables and put them inside
		// `ExecParams`.
		this.#execute = cb;
	}

	execute(params: ExecParams) {
		this.#execute(params);
	}
}

export class SavePlugin extends Plugin {
	#execute: (params: ExecParams) => void;

	constructor(phrase: string, cb: (params: ExecParams) => void) {
		super(phrase);
		// TODO: using `phrase`, fetch all the variables and put them inside
		// `ExecParams`.
		this.#execute = cb;
	}

	execute(params: ExecParams) {
		this.#execute(params);
	}
}
