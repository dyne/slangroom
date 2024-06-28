// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Jsonable, JsonableArray, JsonableObject } from '@slangroom/shared';
import { Plugin, type PluginExecutor } from '@slangroom/core';
import axios, { type AxiosRequestConfig, type AxiosHeaders } from 'axios';
// read the version from the package.json
import packageJson from '@slangroom/http/package.json' with { type: 'json' };

export class HttpError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/http@' + packageJson.version + ' Error';
	}
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const p = new Plugin();

/**
 * The default timeout of an HTTP request in milliseconds.
 */
export const DefaultTimeoutMs = 5000;

const { request } = axios.create({
	headers: { 'Content-Type': 'application/json' },
	validateStatus: null,
	timeout: DefaultTimeoutMs,
});

const defaultRequest = (m: HttpMethod): PluginExecutor => {
	return async (ctx) => {
		const url = ctx.fetchConnect()[0];
		// TODO: typecheck headers
		const headers = ctx.get('headers') as AxiosHeaders;
		const object = ctx.get('object');
		const conf: AxiosRequestConfig = { url: url, method: m };
		if (object) conf.data = object;
		if (headers) conf.headers = headers;
		try {
			const req = await request(conf);
			return ctx.pass({ status: req.status.toString(), result: req.data });
		} catch (e) {
			if (axios.isAxiosError(e)) return ctx.pass({ status: e.code ?? '', result: '' });
			return ctx.fail(new HttpError(e.message));
		}
	};
};

const sameParallelRequest = (m: HttpMethod, isSame: boolean): PluginExecutor => {
	return async (ctx) => {
		const reqs: ReturnType<typeof request<AxiosRequestConfig>>[] = [];
		const urls = ctx.fetchConnect();
		// TODO: typecheck headers
		const headers = ctx.get('headers') as AxiosHeaders;

		if (isSame) {
			// TODO: typecheck object JsonableObject
			const object = ctx.get('object') as undefined | JsonableObject;
			for (const u of urls) {
				const conf: AxiosRequestConfig = { url: u, method: m };
				if (headers) conf.headers = headers;
				if (object) conf.data = object;
				reqs.push(request(conf));
			}
		}
		// parallel
		else {
			// TODO: typecheck object (JsonableArray of JsonableObject)
			const objects = ctx.get('object') as undefined | JsonableArray;
			for (const [i, u] of urls.entries()) {
				const conf: AxiosRequestConfig = { url: u, method: m };
				if (headers) conf.headers = headers;
				if (objects) conf.data = objects[i];
				reqs.push(request(conf));
			}
		}

		const results: { status: string, result: Jsonable }[] = [];
		try {
			(await Promise.allSettled(reqs)).map((x) => {
				if (x.status === 'fulfilled') {
					results.push({ status: x.value.status.toString(), result: x.value.data as Jsonable });
					return;
				}

				const err = x.reason;
				if (axios.isAxiosError(err)) {
					results.push({ status: err.code ?? '', result: '' });
					return;
				}

				throw new HttpError(err.message);
			})
		} catch (e) {
			ctx.fail(new HttpError(e.message));
		}

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
			cb = (ctx) => ctx.fail(new HttpError('sequential requests are not implemented'));
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
