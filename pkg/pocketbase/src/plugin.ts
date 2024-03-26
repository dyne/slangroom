// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PocketBase, { AsyncAuthStore } from 'pocketbase';
import type { FullListOptions, ListResult, RecordModel, RecordOptions } from 'pocketbase';
import { Plugin } from '@slangroom/core';
import { z } from 'zod';
import { Preferences } from '@capacitor/preferences';


let pb: PocketBase;
const p = new Plugin();

const serverUrlSchema = z.literal(
	`http${z.union([z.literal('s'), z.literal('')])}://${z.string()}/`,
);
export type ServerUrl = z.infer<typeof serverUrlSchema>;

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export type Credentials = z.infer<typeof credentialsSchema>;

const baseRecordParametersSchema = z.object({
	expand: z.string().nullish(),
	requestKey: z.string().nullish(),
	fields: z.string().nullish(),
});
export type RecordBaseParameters = z.infer<typeof baseRecordParametersSchema>;

const baseFetchRecordParametersSchema = baseRecordParametersSchema.extend({
	collection: z.string(),
});

const paginationSchema = z.object({
	page: z.number().int(),
	perPage: z.number().int(),
});

const listParametersBaseSchema = z
	.object({
		sort: z.string().nullish(),
	})
	.merge(baseFetchRecordParametersSchema);

const listParametersSchema = z.discriminatedUnion('type', [
	listParametersBaseSchema.extend({ type: z.literal('all'), filter: z.string().nullish() }),
	listParametersBaseSchema.extend({
		type: z.literal('list'),
		filter: z.string().nullish(),
		pagination: paginationSchema,
	}),
	listParametersBaseSchema.extend({ type: z.literal('first'), filter: z.string() }),
]);
export type ListParameters = z.input<typeof listParametersSchema>;

const showParametersSchema = z
	.object({
		id: z.string(),
	})
	.merge(baseFetchRecordParametersSchema);
export type ShowRecordParameters = z.infer<typeof showParametersSchema>;

const createRecordParametersSchema = z
	.object({
		record: z.record(z.string(), z.any()),
        collection: z.string()
	})
export type CreateRecordParameters = z.infer<typeof createRecordParametersSchema>;

const updateRecordParametersSchema = z
	.object({
		id: z.string(),
	})
	.merge(createRecordParametersSchema);
export type UpdateRecordParameters = z.infer<typeof updateRecordParametersSchema>;

const deleteParametersSchema = z.object({
	collection: z.string(),
	id: z.string(),
});
export type DeleteRecordParameters = z.infer<typeof deleteParametersSchema>;

const isPbRunning = async () => {
	const res = await pb.health.check({ requestKey: null });
	return res.code === 200;
};

const createRecordOptions = (p: RecordBaseParameters) => {
	const { expand, fields, requestKey } = p;
	const options: RecordOptions = {};
	if (expand && expand!==null) options.expand = expand;
	if (fields && fields!==null) options.fields = fields;
	if (requestKey && requestKey!==null) options.requestKey = requestKey;
	return options;
};

/**
 * @internal
 */
export const setupClient = p.new('connect', 'start pb client', async (ctx) => {
	const address = ctx.fetchConnect()[0];
	if (typeof address !== 'string') return ctx.fail('Invalid address');
	try {
		pb = new PocketBase(address);
		if (!(await isPbRunning())) return ctx.fail('Client is not running');
		return ctx.pass('pb client successfully created');
	} catch (e) {
		throw new Error(e)
	}
});

export const setupCapacitorClient = p.new('connect', 'start capacitor pb client', async (ctx) => {
	const address = ctx.fetchConnect()[0];
	const PB_AUTH_KEY:string = 'pb_auth'

	const store = new AsyncAuthStore({
		save: async (serialized) => Preferences.set({
			key:PB_AUTH_KEY, value:serialized,
		}),
		initial: Preferences.get({ key:PB_AUTH_KEY }),
	});
	if (typeof address !== 'string') return ctx.fail('Invalid address');
	try {
		pb = new PocketBase(address, store);
		if (!(await isPbRunning())) return ctx.fail('Client is not running');
		return ctx.pass('pb client successfully created');
	} catch (e) {
		throw new Error(e)
	}
});

/**
 * @internal
 */
export const authWithPassword = p.new(['my_credentials'], 'login', async (ctx) => {
	const credentials = ctx.fetch('my_credentials') as Credentials;

	const validation = credentialsSchema.safeParse(credentials);
	if (!validation.success) return ctx.fail(validation.error);
	if (!(await isPbRunning())) return ctx.fail('Client is not running');

	try {
		const res = await pb
			.collection('users')
			.authWithPassword(credentials!.email, credentials!.password, { requestKey: null });
		return ctx.pass({ token: res.token, record: res.record });
	} catch (err) {
		throw new Error(err)
	}
});

/**
 * @internal
 */
export const getList = p.new(['list_parameters'], 'get some records', async (ctx) => {
	const params = ctx.fetch('list_parameters') as ListParameters;
	const validation = listParametersSchema.safeParse(params);
	if (!validation.success) return ctx.fail(validation.error);

	const { collection, sort, filter, expand, type, requestKey } = params;
	if (!(await isPbRunning())) return ctx.fail('client is not working');

	const options: FullListOptions = { requestKey: requestKey || type };
	if (sort) options.sort = sort;
	if (filter) options.filter = filter;
	if (expand) options['expand'] = expand;

	let res: RecordModel | RecordModel[] | ListResult<RecordModel>;
	if (type === 'all') {
		res = await pb.collection(collection).getFullList(options);
	} else if (type === 'list') {
		const { page, perPage } = params.pagination;
		res = await pb.collection(collection).getList(page, perPage, options);
	} else {
		res = await pb.collection(collection).getFirstListItem(filter, options);
	}
	//@ts-expect-error Jsonable should take also ListResult
	return ctx.pass({ records: res });
});

/**
 * @internal
 */
export const showRecord = p.new(['show_parameters'], 'get one record', async (ctx) => {
	const p = ctx.fetch('show_parameters') as ShowRecordParameters;
	const validation = showParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(validation.error);

	const options = createRecordOptions(p);

	try {
		const res = await pb.collection(p.collection).getOne(p.id, options);
		return ctx.pass(res);
	} catch (err) {
		throw new Error(err)
	}
});

/**
 * @internal
 */
export const createRecord = p.new(
	['create_parameters', 'record_parameters'],
	'create record',
	async (ctx) => {
		const p = ctx.fetch('create_parameters') as CreateRecordParameters;
		const r = ctx.fetch('record_parameters') as RecordBaseParameters;

		const validateCreateParams = createRecordParametersSchema.safeParse(p);
		const validateRecordParams = baseRecordParametersSchema.safeParse(r);
		if (!validateCreateParams.success) return ctx.fail(validateCreateParams.error);
		if (!validateRecordParams.success) return ctx.fail(validateRecordParams.error);

		const { collection, record } = p;
		const options = createRecordOptions(r);

		try {
			const res = await pb.collection(collection).create(record, options);
			return ctx.pass(res);
		} catch (err) {
			throw new Error(err.message);
		}
	},
);

/**
 * @internal
 */
export const updateRecord = p.new(
	['update_parameters', 'record_parameters'],
	'update record',
	async (ctx) => {
		const p = ctx.fetch('update_parameters') as UpdateRecordParameters;
		const r = ctx.fetch('record_parameters') as RecordBaseParameters;

		const validateUpdateParams = updateRecordParametersSchema.safeParse(p);
		const validateRecordParams = baseRecordParametersSchema.safeParse(r);
		if (!validateUpdateParams.success) return ctx.fail(validateUpdateParams.error);
		if (!validateRecordParams.success) return ctx.fail(validateRecordParams.error);

		const { collection, record, id } = p;
		const options = createRecordOptions(r);

		try {
			const res = await pb.collection(collection).update(id, record, options);
			return ctx.pass(res);
		} catch (err) {
			throw new Error(err.message);
		}
	},
);

/**
 * @internal
 */
export const deleteRecord = p.new(['delete_parameters'], 'delete record', async (ctx) => {
	const p = ctx.fetch('delete_parameters') as DeleteRecordParameters;

	const validation = deleteParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(validation.error);

	const { collection, id } = p;
	const res = await pb.collection(collection).delete(id);
	if (res) return ctx.pass('deleted');
	return ctx.fail('shit happened');
});

const sendParametersSchema = z.object({
  fetch: z.any(),
  headers: z.record(z.unknown()).nullish(),
  body: z.any(),
  query: z.record(z.unknown()).nullish(),
  requestKey: z.string().nullish(),
});
export type SendParameters = z.infer<typeof sendParametersSchema>;

const urlSchema = z.string()


export const sendRequest = p.new(['url','send_parameters'], 'send request', async (ctx) => {
	const p = ctx.fetch('send_parameters')
	const u = ctx.fetch('url')

	const validation = sendParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(validation.error);

	const validateUrl = urlSchema.safeParse(u)
	if (!validateUrl.success) return ctx.fail(validateUrl.error)

	// @ts-expect-error - Somehow, "send" requires properties that are not
	const res = await pb.send(u, p)
	if (res) return ctx.pass(res);
	return ctx.fail('shit happened');
})

export const pocketbase = p;

