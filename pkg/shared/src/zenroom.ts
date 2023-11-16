import type { JsonableObject } from '@slangroom/shared';
import { zencode_exec } from '@slangroom/deps/zenroom';

/**
 * Output of execution of a contract in Zenroom.
 */
export type ZenOutput = {
	result: JsonableObject;
	logs: string;
};

/**
 * Error thrown by [zenroomExec] if contract execution somehow fails.
 *
 * The [message] contains the logs.
 */
export class ZenError extends Error {
	constructor(logs: string) {
		super(logs);
		this.name = 'ZenroomError';
	}
}

/**
 * Zenroom parameters suitable for [[zencode_exec]] (after the values of data
 * and keys have been piped to [[JSON.stringify]])
 */
export type ZenParams = {
	data: JsonableObject;
	keys: JsonableObject;
	extra?: JsonableObject;
	conf?: string;
};

const stringify = (params: ZenParams) => {
	return {
		data: JSON.stringify(params.data),
		keys: JSON.stringify(params.keys),
		extra: JSON.stringify(params.extra || {}),
		conf: params.conf || '',
	};
};

/**
 * Executes a contract with provided parameters in Zenroom.
 *
 * @param contract is a zencode contract.
 * @param params is parameters to Zenroom.
 * @returns the output of Zenroom.
 * @throws {ZenroomError} if execution of a contract fails.
 */
export const zencodeExec = async (contract: string, params: ZenParams): Promise<ZenOutput> => {
	let tmp: { result: string; logs: string };
	try {
		tmp = await zencode_exec(contract, stringify(params));
	} catch (e) {
		throw new ZenError(e.logs);
	}
	// Due to the try-catch above, it is ensured that [tmp.result] is a JSON
	// string, whoose top-level value is a JSON Object.  Thus, return's [result]
	// is a JS Object.
	return {
		result: JSON.parse(tmp.result),
		logs: tmp.logs,
	};
};
