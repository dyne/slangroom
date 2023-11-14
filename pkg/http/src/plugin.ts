import { JsonableArray } from '@slangroom/shared';
import type { Plugin, PluginContext, PluginResult } from '@slangroom/core';
import { parser } from '@slangroom/http';
import axios, { type AxiosRequestConfig } from 'axios';

/**
 * The default timeout of an HTTP request in milliseconds.
 */
export const DefaultTimeoutMs = 5000;

const { request } = axios.create({
	headers: { 'Content-Type': 'application/json' },
	validateStatus: null,
	timeout: DefaultTimeoutMs,
});

/**
 * @internal
 */
export const execute = async (
	ctx: PluginContext,
	kind: 'default' | 'sequential' | 'parallel' | 'same',
	method: 'get' | 'post' | 'put' | 'patch' | 'delete',
): Promise<PluginResult> => {
	const url = ctx.fetchConnect()[0];
	const headers = ctx.get('headers');
	if (kind === 'default') {
		let error: any = null;
		const requestData: AxiosRequestConfig = {
			url: url,
			method: method,
			data: ctx.get('object') as any,
		};
		if (headers) requestData['headers'] = headers as any;
		const req = await request(requestData).catch((e) => (error = e));
		const zenResult = error
			? { status: error.code, error: '' }
			: { status: req.status, result: req.data || '' };
		return ctx.pass(zenResult);
	} else if (kind === 'sequential') {
		throw new Error('Not yet implemented');
	} else {
		const reqs = [];
		const urls = ctx.fetchConnect();
		if (kind === 'parallel') {
			// TODO: check type of body (needs to be JsonableArray of
			// JsonableObject)
			const objects = ctx.fetch('object') as JsonableArray;
			for (const [i, u] of urls.entries()) {
				const requestData: AxiosRequestConfig = {
					url: u,
					method: method,
					data: objects[i],
				};
				if (headers) {
					requestData['headers'] = headers as any;
				}
				reqs.push(request(requestData));
			}
		} else {
			// TODO: check type of body (needs to be JsonableObject)
			const object = ctx.fetch('object') as JsonableArray;
			for (const u of urls) {
				const requestData: AxiosRequestConfig = {
					url: u,
					method: method,
					data: object,
				};
				if (headers) {
					requestData['headers'] = headers as any;
				}
				reqs.push(request(requestData));
			}
		}
		const results: JsonableArray = new Array(reqs.length);
		const errors: { [key: number]: any } = {};
		const parallelWithCatch = reqs.map((v, i) => v.catch((e) => (errors[i] = e)));
		const parallelResults = await axios.all(parallelWithCatch);
		parallelResults.map((r, i) => {
			const zenResult = errors[i]
				? { status: errors[i].code, result: '' }
				: { status: r.status, result: r.data || '' };
			results[i] = zenResult;
		});
		return ctx.pass(results);
	}
};

export const http: Plugin = {
	parser: parser,
	executor: async (ctx) => {
		switch (ctx.phrase) {
			case 'do get':
				return await execute(ctx, 'default', 'get');
			case 'do sequential get':
				return await execute(ctx, 'sequential', 'get');
			case 'do parallel get':
				return await execute(ctx, 'parallel', 'get');
			case 'do same get':
				return await execute(ctx, 'same', 'get');
			case 'do post':
				return await execute(ctx, 'default', 'post');
			case 'do sequential post':
				return await execute(ctx, 'sequential', 'post');
			case 'do parallel post':
				return await execute(ctx, 'parallel', 'post');
			case 'do same post':
				return await execute(ctx, 'same', 'post');
			default:
				return ctx.fail('no match');
		}
	},
};
