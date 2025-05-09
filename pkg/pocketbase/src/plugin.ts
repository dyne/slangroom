// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PocketBase, { AsyncAuthStore } from 'pocketbase';
import type { FullListOptions, ListResult, RecordModel, RecordOptions } from 'pocketbase';
import { Plugin } from '@slangroom/core';
import { z } from 'zod';
import { Preferences } from '@capacitor/preferences';
// read the version from the package.json
import packageJson from '@slangroom/pocketbase/package.json' with { type: 'json' };

export const version = packageJson.version;

export class PocketBaseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/pocketbase@' + packageJson.version + ' Error';
	}
}

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
	if (typeof address !== 'string') return ctx.fail(new PocketBaseError('Invalid address'));
	try {
		pb = new PocketBase(address);
		if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('Client is not running'));
		return ctx.pass('pb client successfully created');
	} catch (e) {
		return ctx.fail(new PocketBaseError(e.message));
	}
});

const init = async (key: string) => { return (await Preferences.get({ key })).value }

export const setupCapacitorClient = p.new('connect', 'start capacitor pb client', async (ctx) => {
	if (typeof window === 'undefined') return ctx.fail(new PocketBaseError('Can not start capacitor client in node environment'));
	const address = ctx.fetchConnect()[0];
	if (typeof address !== 'string') return ctx.fail(new PocketBaseError('Invalid address'));
	const PB_AUTH_KEY:string = 'pb_auth'

	const store = new AsyncAuthStore({
		save: async (serialized) => await Preferences.set({
			key:PB_AUTH_KEY, value:serialized,
		}),
		initial: init(PB_AUTH_KEY),
	});
	try {
		pb = new PocketBase(address, store);
		if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('Client is not running'));
		return ctx.pass('pb client successfully created');
	} catch (e) {
		return ctx.fail(new PocketBaseError(e.message));
	}
});

/**
 * @internal
 */
export const authWithPassword = p.new(['my_credentials'], 'login', async (ctx) => {
	const credentials = ctx.fetch('my_credentials') as Credentials;

	const validation = credentialsSchema.safeParse(credentials);
	if (!validation.success) return ctx.fail(new PocketBaseError(validation.error.message));
	if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('Client is not running'));

	try {
		const res = await pb
			.collection('users')
			.authWithPassword(credentials!.email, credentials!.password, { requestKey: null });
		return ctx.pass({ token: res.token, record: res.record });
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
});

/**
 * @internal
 */
export const authRefresh = p.new('refresh token', async (ctx) => {
	if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('Client is not running'));
	if (!pb.authStore.isValid) return ctx.fail(new PocketBaseError('Invalid token'));

	try {
		const res = await pb
			.collection('users')
			.authRefresh();
		return ctx.pass({ token: res.token, record: res.record });
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
});

/**
 * @internal
 */
export const requestPasswordReset = p.new(['email'], 'ask password reset', async (ctx) => {
	const email = ctx.fetch('email') as string;
	if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('Client is not running'));

	try {
		const res = await pb.collection('users').requestPasswordReset(email);
		return ctx.pass({res});
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
});

// At the moment this statement is not used
// and there is not a simple way to test it
// thus it is commented out
/*
const confirmPassswordResetParametersSchema = z.object({
	token: z.string(),
	newPassword: z.string().min(8).max(73),
	newPasswordConfirm: z.string().min(8).max(73),
});
export type ConfirmPassswordResetParameters = z.infer<typeof confirmPassswordResetParametersSchema>;
export const confirmPassswordReset = p.new(['reset_parameters'], 'confirm password reset', async (ctx) => {
const p = ctx.fetch('reset_parameters') as ConfirmPassswordResetParameters;

const validation = confirmPassswordResetParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(validation.error);
	if (!(await isPbRunning())) return ctx.fail('Client is not running');
	try {
		const res = await pb.collection('users').confirmPasswordReset(p.token, p.newPassword, p.newPasswordConfirm);
		return ctx.pass(res);
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
});
*/

/**
 * @internal
 */
export const getList = p.new(['list_parameters'], 'get some records', async (ctx) => {
	const params = ctx.fetch('list_parameters') as ListParameters;
	const validation = listParametersSchema.safeParse(params);
	if (!validation.success) return ctx.fail(new PocketBaseError(validation.error.message));

	const { collection, sort, filter, expand, type, requestKey } = params;
	if (!(await isPbRunning())) return ctx.fail(new PocketBaseError('client is not working'));

	const options: FullListOptions = { requestKey: requestKey || type };
	if (sort) options.sort = sort;
	if (filter) options.filter = filter;
	if (expand) options['expand'] = expand;

	let res: RecordModel | RecordModel[] | ListResult<RecordModel>;
	try {
		if (type === 'all') {
			res = await pb.collection(collection).getFullList(options);
		} else if (type === 'list') {
			const { page, perPage } = params.pagination;
			res = await pb.collection(collection).getList(page, perPage, options);
		} else {
			res = await pb.collection(collection).getFirstListItem(filter, options);
		}
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
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
	if (!validation.success) return ctx.fail(new PocketBaseError(validation.error.message));

	const options = createRecordOptions(p);

	try {
		const res = await pb.collection(p.collection).getOne(p.id, options);
		return ctx.pass(res);
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
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
		if (!validateCreateParams.success) return ctx.fail(new PocketBaseError(validateCreateParams.error.message));
		if (!validateRecordParams.success) return ctx.fail(new PocketBaseError(validateRecordParams.error.message));

		const { collection, record } = p;
		const options = createRecordOptions(r);

		try {
			const res = await pb.collection(collection).create(record, options);
			return ctx.pass(res);
		} catch (err) {
			return ctx.fail(new PocketBaseError(err.message));
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
		if (!validateUpdateParams.success) return ctx.fail(new PocketBaseError(validateUpdateParams.error.message));
		if (!validateRecordParams.success) return ctx.fail(new PocketBaseError(validateRecordParams.error.message));

		const { collection, record, id } = p;
		const options = createRecordOptions(r);

		try {
			const res = await pb.collection(collection).update(id, record, options);
			return ctx.pass(res);
		} catch (err) {
			return ctx.fail(new PocketBaseError(err.message));
		}
	},
);

/**
 * @internal
 */
export const deleteRecord = p.new(['delete_parameters'], 'delete record', async (ctx) => {
	const p = ctx.fetch('delete_parameters') as DeleteRecordParameters;

	const validation = deleteParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(new PocketBaseError(validation.error.message));

	const { collection, id } = p;
	try {
		await pb.collection(collection).delete(id);
		return ctx.pass('deleted');
	} catch (err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
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
	if (!validation.success) return ctx.fail(new PocketBaseError(validation.error.message));

	const validateUrl = urlSchema.safeParse(u);
	if (!validateUrl.success) return ctx.fail(new PocketBaseError(validateUrl.error.message));

	try {
		// @ts-expect-error - Somehow, "send" requires properties that are not
		const res = await pb.send(u, p);
		return ctx.pass(res);
	} catch(err) {
		return ctx.fail(new PocketBaseError(err.message));
	}
})

export const pocketbase = p;

