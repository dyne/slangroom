// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin, PluginContext } from '@slangroom/core';
import type { JsonableObject } from '@slangroom/shared';
import * as redisClient from "@redis/client";
// read the version from the package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('@slangroom/redis/package.json');

export class RedisError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/redis@' + packageJson.version + ' Error';
	}
}

const p = new Plugin();

/**
 * @internal
 */
export const write = p.new('connect',
	['key', 'object'],
	'write object into key in redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		await client.connect();
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail(new RedisError('key must be string'));
		const data = ctx.fetch("object") as JsonableObject;

		return ctx.pass(await client.set(key, JSON.stringify(data)));
	},
);

export const read = p.new('connect',
	['key'],
	'read key from redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail(new RedisError('key must be string'));
		await client.connect();
		await client.sendCommand(["SETNX", key, "{}"]);

		return ctx.pass(JSON.parse((await client.get(key)) || "{}"));
	},
);
export const deleteRedis = p.new('connect',
	['key'],
	'delete key from redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail(new RedisError('key must be string'));
		await client.connect();

		return ctx.pass(await client.del(key))
	},
);
export const redis = p;
