// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { zencodeParse } from '@slangroom/shared';

/**
 * Finds statements ignored by Zenroom in the provided contract.
 *
 * If no statement is found, then that means the contract was executed with
 * only statements found in Zenroom itself, thus no customization is possible.
 *
 * @param contract is the Zenroom contract.
 * @param params is the parameters of Zenroom, such as data and keys.
 * @returns the array of ignored statements.
 */
export const getIgnoredStatements = async (
	contract: string,
): Promise<{ignoredLines: [string, number][], invalidLines: {message: Error, lineNo: number}[]}> => {
	let zout: {result: {ignored: [string, number][], invalid: [string, number, string][]}; logs: string};
	try {
		zout = await zencodeParse(contract);
	} catch (e) {
		throw e;
	}
	return {
		ignoredLines: zout.result.ignored.map((x) => [x[0].trim(), x[1]]),
		invalidLines: zout.result.invalid.map((x) => ({ message: new Error(x[2]), lineNo: x[1] }))
	};
};
