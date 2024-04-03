// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { JsonableArray, JsonableObject } from '@slangroom/shared';
import { Plugin, type PluginExecutor } from '@slangroom/core';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const p = new Plugin();

/**
 * The default timeout of an HTTP request in milliseconds.
 */
export const DefaultTimeoutMs = 5000;
export const DefaultHeaders = { 'Content-Type': 'application/json' }
let defaultOptions: Record<string, any> = {
	timeout: DefaultTimeoutMs,
	validateStatus: null,
	headers: DefaultHeaders
}

const defaultRequest = (m: HttpMethod): PluginExecutor => {
	return async (ctx) => {
		const url = ctx.fetchConnect()[0];
		// TODO: typecheck headers
		const headers = ctx.get('headers') as any;
		const object = ctx.get('object');
		const options = defaultOptions;
		options['method'] = m;
		if (object) options['body'] = JSON.stringify(object);
		if (headers) options['headers'] = { ...DefaultHeaders, ...headers };
		try {
			const response = await fetch(url, options);
			let data = await response.text();
			try {
				data = JSON.parse(data);
			} catch(e) {}
			const responseHeaders: Record<string, any> = {}
			response.headers.forEach((v, k) => {
				responseHeaders[k] = v
			})
			return ctx.pass({ status: response.status.toString(), result: data, headers: responseHeaders });
		} catch (e) {
			if (e.isFetchError) return ctx.pass({ status: e.code ?? '', result: e.message, headers: {} });
			throw e;
		}
	};
};

const sameParallelRequest = (m: HttpMethod, isSame: boolean): PluginExecutor => {
	return async (ctx) => {
		const reqs: Promise<Response>[] = [];
		const urls = ctx.fetchConnect();
		const options = defaultOptions;
		options['method'] = m;
		// TODO: typecheck headers
		const headers = ctx.get('headers') as any;
		if (headers) options['headers'] = { ...DefaultHeaders, ...headers };
		if (isSame) {
			// TODO: typecheck object JsonableObject
			const object = ctx.get('object') as undefined | JsonableObject;
			for (const u of urls) {
				reqs.push(fetch(u, { ...options, body: JSON.stringify(object) }));
			}
		}
		// parallel
		else {
			// TODO: typecheck object (JsonableArray of JsonableObject)
			const objects = ctx.get('object') as undefined | JsonableArray;
			for (const [i, u] of urls.entries()) {
				reqs.push(fetch(u, { ...options, body: JSON.stringify(objects && objects[i]) }));
			}
		}

		const results = await Promise.all((await Promise.allSettled(reqs)).map(async (x) => {
			if (x.status === 'fulfilled') {
				let data = await x.value.text();
				try {
					data = JSON.parse(data);
				} catch(e) {}
				const responseHeaders: Record<string, any> = {}
				x.value.headers.forEach((v, k) => {
					responseHeaders[k] = v
				})
				return { status: x.value.status.toString(), result: data, headers: responseHeaders };
			}


			const err = x.reason;
			if (err.isFetchError) return { status: err.code ?? '', result: err.message, headers: {} };

			throw x.reason;
		}));

		return ctx.pass(results);
	};
};

/**
 * @internal
 */
export const defaults = {} as {
	[K in
		| HttpMethod
		| `${HttpMethod}Object`
		| `${HttpMethod}Headers`
		| `${HttpMethod}ObjectHeaders`]: PluginExecutor;
};

/*
 * @internal
 */
export const sequentials = {} as typeof defaults;

/**
 * @internal
 */
export const parallels = {} as typeof defaults;

/**
 * @internal
 */
export const sames = {} as typeof defaults;

(['get', 'post', 'put', 'patch', 'delete'] as HttpMethod[]).forEach((m) => {
	[defaults, sequentials, parallels, sames].forEach((x) => {
		let phrase: string, cb: PluginExecutor;
		if (x === defaults) {
			phrase = `do ${m}`;
			cb = defaultRequest(m);
		} else if (x === sequentials) {
			phrase = `do sequential ${m}`;
			cb = (ctx) => ctx.fail('not implemented');
		} else if (x === parallels) {
			phrase = `do parallel ${m}`;
			cb = sameParallelRequest(m, false);
		} else if (x === sames) {
			phrase = `do same ${m}`;
			cb = sameParallelRequest(m, true);
		} else {
			throw new Error('unreachable');
		}

		x[m] = p.new('connect', phrase, cb);
		x[`${m}Headers`] = p.new('connect', ['headers'], phrase, cb);
		if (m != 'get') {
			x[`${m}Object`] = p.new('connect', ['object'], phrase, cb);
			x[`${m}ObjectHeaders`] = p.new('connect', ['object', 'headers'], phrase, cb);
		}
	});
});

export const http = p;
