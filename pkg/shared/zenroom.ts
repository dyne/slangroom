import { JsonableObject } from './jsonable';

import { zencode_exec } from '@slangroom/deps/zenroom';

/**
 * Output of execution of a contract in Zenroom.
 */
export type ZenroomOutput = {
	result: JsonableObject;
	logs: string;
};

/**
 * Error thrown by [zenroomExec] if contract execution somehow fails.
 *
 * The [message] contains the logs.
 */
export class ZenroomError extends Error {
	constructor(logs: string) {
		super(logs);
		this.name = 'ZenroomError';
	}
}

/**
 * Zenroom parameters suitable for zencode_exec() (after each value's
 * been piped to JSON.stringify()).
 */
export type ZenroomParams = { data?: JsonableObject; keys?: JsonableObject };

/**
 * Like ZenroomParams, but each value's been piped into JSON.stringify().
 *
 * Also, the keys are readonly since it makes little sense to mutate
 * them after they're converted to JSON strings.
 */
export type ZenroomStringParams = { readonly [K in keyof ZenroomParams]?: string };

/**
 * A utility that converts each value in ZenroomParams to a JSON string
 * if possible.
 *
 * @param params is the ZenroomParams to be.
 * @returns params with each value converted to a JSON string, or
 * undefined if params' values are null or undefined.
 */
export const convZenParams = (params?: ZenroomParams): ZenroomStringParams => {
	// We remove readonly here, and at the end, we put it back due to
	// the return type.
	const ret: { -readonly [k in keyof ZenroomStringParams]: ZenroomStringParams[k] } = {};
	for (const k in params) {
		if (k == 'data' || k == 'keys') {
			if (params[k]) ret[k] = JSON.stringify(params[k]);
		}
	}
	return ret;
};

/**
 * Executes a contract with provided parameters in Zenroom.
 *
 * @param contract is a zencode contract.
 * @param params is parameters to Zenroom.
 * @returns the output of Zenroom.
 * @throws {ZenroomError} if execution of a contract fails.
 */
export const zencodeExec = async (
	contract: string,
	params?: ZenroomParams
): Promise<ZenroomOutput> => {
	let tmp: { result: string; logs: string };
	try {
		tmp = await zencode_exec(contract, convZenParams(params));
	} catch (e) {
		throw new ZenroomError(e.logs);
	}
	// Due to the try-catch above, it is ensured that [tmp.result] is a JSON
	// string, whoose top-level value is a JSON Object.  Thus, return's [result]
	// is a JS Object.
	return {
		result: JSON.parse(tmp.result),
		logs: tmp.logs,
	};
};
