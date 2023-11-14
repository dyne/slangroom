import type { JsonableArray } from '@slangroom/shared';
import { Plugin, type PluginExecutor } from '@slangroom/core';
import axios, { type AxiosRequestConfig } from 'axios';

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
		const headers = ctx.get('headers') as any;
		const object = ctx.get('object');
		let error: any = null;
		const conf: AxiosRequestConfig = { url: url, method: m };
		if (object) conf.data = object;
		if (headers) conf.headers = headers;
		const req = await request(conf).catch((e) => (error = e));
		const zenResult = error
			? { status: error.code, error: '' }
			: { status: req.status, result: req.data || '' };
		return ctx.pass(zenResult);
	};
};

const parallelRequest = (m: HttpMethod): PluginExecutor => {
	return async (ctx) => {
		const reqs = [];
		const urls = ctx.fetchConnect();
		// TODO: typecheck object (JsonableArray of JsonableObject)
		const objects = ctx.get('object') as undefined | JsonableArray;
		// TODO: typecheck headers
		const headers = ctx.get('headers') as any;
		for (const [i, u] of urls.entries()) {
			const conf: AxiosRequestConfig = { url: u, method: m };
			if (objects) conf.data = objects[i];
			if (headers) conf.headers = headers;
			reqs.push(request(conf));
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
	};
};

const sameRequest = (m: HttpMethod): PluginExecutor => {
	return async (ctx) => {
		const reqs = [];
		const urls = ctx.fetchConnect();
		// TODO: typecheck object (JsonableArray of JsonableObject)
		const object = ctx.get('object') as undefined | JsonableArray;
		// TODO: typecheck headers
		const headers = ctx.get('headers') as any;
		for (const u of urls) {
			const conf: AxiosRequestConfig = { url: u, method: m };
			if (object) conf.data = object;
			if (headers) conf.headers = headers;
			reqs.push(request(conf));
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
			cb = parallelRequest(m);
		} else if (x === sames) {
			phrase = `do same ${m}`;
			cb = sameRequest(m);
		} else {
			throw new Error('unreachable');
		}

		x[m] = p.new('connect', phrase, cb);
		x[`${m}Object`] = p.new('connect', ['object'], phrase, cb);
		x[`${m}Headers`] = p.new('connect', ['headers'], phrase, cb);
		x[`${m}ObjectHeaders`] = p.new('connect', ['object', 'headers'], phrase, cb);
	});
});

export const http = p;
