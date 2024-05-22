// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { zencodeParse } from '@slangroom/shared';

/**
 * Represent zencode invalid statement error
 */
export class InvalidStatementError extends Error {
    constructor(e: string, couldBeIgnore: boolean) {
		if (couldBeIgnore) e = 'Maybe missing: \x1b[35mRule unknown ignore\x1b[0m\n' + e;
        super(e);
        this.name = 'Zencode Invalid Statement Error';
    }
}


/**
 * Check if the statement could be an ignored statement and thus adding Rule unknown ignore can solve the problem
 * This is done by checking if invalid statements are at the beggining of the contract, i.e. before any valid given line,
 * or at the bottom of the contract, i.e. all statements after it that are valid are empty lines or comments.
 *
 * @param {number} lineNo is the line number of the invalid statement
 * @param {string} contract is the Zenroom contract
 * @param {number[]} invalidLinesNos is the list of all invalid lines number
 * @returns {boolean} true if the statement could be an ignored statement, false otherwise
 */
const couldBeIgnored = (lineNo: number, contract: string, invalidLinesNos: number[]) => {
	const contractArray = contract.split('\n');
	const validLinesBeforeLineNo = contractArray.slice(0, lineNo-1).filter((_v, i) => !invalidLinesNos.includes(i+1));
	const validGivenLine = validLinesBeforeLineNo.some((x: string) => x.toLowerCase().trim().startsWith('given'));
	if (!validGivenLine) {
		return true;
	} else {
		const validThenLine = validLinesBeforeLineNo.some((x: string) => x.toLowerCase().trim().startsWith('then'));
		if (validThenLine) {
			const validLinesAfterLineNo = contractArray.slice(lineNo).filter((_v, i) => !invalidLinesNos.includes(i+1));
			if(validLinesAfterLineNo.every((x: string) => x.trim() == '' || x.trim().startsWith('#'))) {
				return true;
			}
		}
	}
	return false;
}
/**
 * Finds statements ignored by Zenroom in the provided contract.
 *
 * If no statement is found, then that means the contract was executed with
 * only statements found in Zenroom itself, thus no customization is possible.
 *
 * @param contract is the Zenroom contract.
 * @returns a dictionary containing ignored and invalid statements.
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
	const invalidLinesNos: number[] = zout.result.invalid.map((x) => x[1]);
	const ruleUnknownIgnore = JSON.parse(zout.logs).some((x: string) => x.toLowerCase().includes('rule unknown ignore'));;
	return {
		ignoredLines: zout.result.ignored.map((x) => [x[0].trim(), x[1]]),
		invalidLines: zout.result.invalid.map((x) => {
			return { message: new InvalidStatementError(x[2], !ruleUnknownIgnore && couldBeIgnored(x[1], contract, invalidLinesNos)), lineNo: x[1] };
		})
	};
};
