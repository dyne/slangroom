// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import type { JsonableObject } from '@slangroom/shared';
import { zencodeExec } from '@slangroom/shared';
// read the version from the package.json
import packageJson from '@slangroom/zencode/package.json' with { type: 'json' };

export const version = packageJson.version;

export class ZencodeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/zencode@' + packageJson.version + ' Error';
	}
}

const p = new Plugin();

const exec = async (script: string, data: JsonableObject, keys: JsonableObject, extra: JsonableObject, conf: string = '') => {
	if (!script) throw new Error('script is required');
	if (!data) throw new Error('data is required');
	if (!keys) throw new Error('keys is required');

	return await zencodeExec(script, { data, keys, extra, conf });
}

/**
 * @internal
 */
export const zencodeExecPlugin = p.new(['script', 'data', 'keys' ], 'execute zencode', async (ctx) => {
	const script = ctx.fetch('script') as string;
	const data = (ctx.get('data') || {}) as JsonableObject;
	const keys = (ctx.get('keys') || {}) as JsonableObject;
	const extra = {} as JsonableObject;
	const conf = "";

	try {
		const zout = await exec(script, data, keys, extra, conf);
		return ctx.pass(zout.result);
	} catch (e) {
		return ctx.fail(new ZencodeError(e.message));
	}
});

/**
 * @internal
 */
export const zencodeExecFullPlugin = p.new(['script', 'data', 'keys', 'extra', 'conf'], 'execute zencode', async (ctx) => {
	const script = ctx.fetch('script') as string;
	const data = (ctx.get('data') || {}) as JsonableObject;
	const keys = (ctx.get('keys') || {}) as JsonableObject;
	const extra = (ctx.get('extra') || {}) as JsonableObject;
	const conf = (ctx.get('conf') || "") as string;

	try {
		const zout = await exec(script, data, keys, extra, conf);
		return ctx.pass(zout.result);
	} catch (e) {
		return ctx.fail(new ZencodeError(e.message));
	}
});



export const zencode = p;
