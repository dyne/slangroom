// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { zencodeExec, type ZenParams } from '@slangroom/shared';

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
	params: ZenParams,
): Promise<[string, number][]> => {
	// Since we want to get the list of ignored statements, we don't want to
	// throw if Zenroom execution fails (but we do fail if something other than
	// that happens).  When Zenroom fails, the ZenroomError type's message
	// contains the logs.
	let logs: string[];
	try {
		// TODO: the zencodeExec() call could potentially be optimized, as
		// zencodeExec() parses the output result.  Keep in mind: optimization bad.
		const zout = await zencodeExec(contract, params);
		logs = JSON.parse(zout.logs);
	} catch (e) {
		// Currently, only ZenError is available.
		// Normally, I'd let this code be, but we're trying to achieve 100%
		// coverage, so my "future-proof" code needs to be commented out here.
		// if (!(e instanceof ZenroomError))
		// 	throw e;
		logs = JSON.parse(e.message);
	}
	const regexIgnored = /^\[W\] Zencode line (?<lineNo>[0-9]+) pattern ignored: (?<statement>.*)$/;
	const ret: [string, number][] = [];
	logs.forEach((x) => {
		const l = x.match(regexIgnored);
		if (!l)
			// skip if not found
			return;
		if (!l.groups || l.groups['statement'] == null || l.groups['lineNo'] == null) {
			console.log('YOOOO', x, l);
			throw new Error('no match');
		}
		const lineNo = l.groups['lineNo'],
			stmnt = l.groups['statement'];
		ret.push([stmnt, parseInt(lineNo)]);
	});
	return ret;
};
