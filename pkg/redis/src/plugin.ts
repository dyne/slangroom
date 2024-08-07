// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin, PluginContext } from '@slangroom/core';
import type { JsonableObject } from '@slangroom/shared';
import * as redisClient from "@redis/client";
// read the version from the package.json
import packageJson from '@slangroom/redis/package.json' with { type: 'json' };

export const version = packageJson.version;

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
		try {
			await client.connect();
		} catch (e) {
			return ctx.fail(new RedisError(e.message));
		}
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
		try {
			await client.connect();
		} catch (e) {
			return ctx.fail(new RedisError(e.message));
		}
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
		try {
			await client.connect();
		} catch (e) {
			return ctx.fail(new RedisError(e.message));
		}

		return ctx.pass(await client.del(key))
	},
);
export const redis = p;
