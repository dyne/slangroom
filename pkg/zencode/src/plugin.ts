import { Plugin  } from '@slangroom/core';
import type { JsonableObject } from '@slangroom/shared';
import { zencodeExec } from '@slangroom/shared';

const p = new Plugin();

/**
 * @internal
 */
export const zencodeExecPlugin = p.new(['script', 'data', 'keys', 'extra', 'conf'], 'execute zencode', async (ctx) => {
	const script = ctx.fetch('script') as string;
	const data = (ctx.get('data') || {}) as JsonableObject;
	const keys = (ctx.get('keys') || {}) as JsonableObject;
	const extra = (ctx.get('extra') || {}) as JsonableObject;
	const conf = (ctx.get('conf') || "") as string;

	const zout = await zencodeExec(script, { data, keys, extra, conf	});

	return ctx.pass(zout.result)
});



export const zencode = p;
