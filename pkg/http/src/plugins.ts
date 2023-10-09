import { JsonableArray } from '@slangroom/shared';
import type { PluginContext, PluginResult } from '@slangroom/core';
import { lex, parse, visit, RequestKind, RequestMethod, type PhraseCst } from '@slangroom/http';
import axios from 'axios';

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
export const astify = (text: string) => {
	const lexed = lex(text);
	if (lexed.errors.length) return { errors: lexed.errors };

	const parsed = parse(lexed.tokens);
	if (parsed.errors.length) return { errors: parsed.errors };

	return { ast: visit(parsed.cst as PhraseCst) };
};

/**
 * @internal
 */
export const execute = async (
	ctx: PluginContext,
	kind: RequestKind,
	method: RequestMethod
): Promise<PluginResult> => {
	const url = ctx.fetchConnect()[0];
	if (kind === RequestKind.Default) {
		let error: any = null;
		const req = await request({
			url: url,
			method: method,
			data: ctx.get('object'),
		}).catch((e) => (error = e));
		const zenResult = error
			? { status: error.code, error: '' }
			: { status: req.status, result: req.data || '' };
		return ctx.pass(zenResult);
	} else if (kind === RequestKind.Sequential) {
		throw new Error('Not yet implemented');
	} else {
		const reqs = [];
		const urls = ctx.fetchConnect();
		if (kind === RequestKind.Parallel) {
			// TODO: check type of body (needs to be JsonableArray of
			// JsonableObject)
			const objects = ctx.fetch('object') as JsonableArray;
			for (const [i, u] of urls.entries())
				reqs.push(request({ url: u, method: method, data: objects[i] }));
		} else {
			// TODO: check type of body (needs to be JsonableObject)
			const object = ctx.fetch('object') as JsonableArray;
			for (const u of urls) reqs.push(request({ url: u, method: method, data: object }));
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

const HttpPlugin = async (ctx: PluginContext): Promise<PluginResult> => {
	const { ast, errors } = astify(ctx.phrase);
	if (!ast) return ctx.fail(errors);
	return await execute(ctx, ast.kind, ast.method);
};

export const httpPlugins = new Set([HttpPlugin]);
