import { Plugin, PluginContext } from '@slangroom/core';
import { JsonableObject } from '@slangroom/shared';
import * as redisClient from "@redis/client";
const p = new Plugin();

/**
 * @internal
 */
export const write = p.new('connect',
	['key', 'object'],
	'write to redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		await client.connect();
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail('key must be string');
		const data = ctx.fetch("object") as JsonableObject;

		return ctx.pass(await client.set(key, JSON.stringify(data)));
	},
);

export const read = p.new('connect',
	['key'],
	'read from redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail('key must be string');
		await client.connect();
		await client.sendCommand(["SETNX", key, "{}"]);

		return ctx.pass(JSON.parse((await client.get(key)) || "{}"));
	},
);
export const deleteRedis = p.new('connect',
	['key'],
	'delete from redis',
	async (ctx: PluginContext) => {
		const redisUrl = ctx.fetchConnect()[0];
		const client = redisClient.createClient({ url: redisUrl });
		const key = ctx.fetch("key") as string;
		if (typeof key !== 'string') return ctx.fail('key must be string');
		await client.connect();

		return ctx.pass(await client.del(key))
	},
);
export const redis = p;
