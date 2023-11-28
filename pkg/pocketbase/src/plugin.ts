import PocketBase, { FullListOptions, ListResult, RecordModel, RecordOptions } from 'pocketbase';
import { Plugin } from '@slangroom/core';
import { z } from 'zod';

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
	expand: z.string().optional(),
	requestKey: z.string().optional(),
	fields: z.string().optional(),
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
		sort: z.string().default('-created').optional(),
	})
	.merge(baseFetchRecordParametersSchema);

const listParametersSchema = z.discriminatedUnion('type', [
	listParametersBaseSchema.extend({ type: z.literal('all'), filter: z.string().optional() }),
	listParametersBaseSchema.extend({
		type: z.literal('list'),
		filter: z.string().optional(),
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
	})
	.merge(baseFetchRecordParametersSchema);

export type CreateRecordParameters = z.infer<typeof createRecordParametersSchema>;

const isPbRunning = async () => {
	const res = await pb.health.check({ requestKey: null });
	if (res.code !== 200) return false;
	return true;
};

/**
 * @internal
 */
export const setupClient = p.new(['pb_address'], 'create pb_client', async (ctx) => {
	const address = ctx.fetch('pb_address');
	if (typeof address !== 'string') return ctx.fail('Invalid address');
	try {
		pb = new PocketBase(address);
		const res = await pb.health.check({ requestKey: null });
		if (res.code !== 200) ctx.fail('server error');
		return ctx.pass('pb client successfully created');
	} catch (e) {
		return ctx.fail('Invalid address');
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
		return ctx.fail(err);
	}
});

/**
 * @internal
 */
export const getList = p.new(['list_parameters'], 'ask records', async (ctx) => {
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
	//@ts-expect-error JsonableObject should take also ListResult
	return ctx.pass({ records: res });
});

/**
 * @internal
 */
export const showRecord = p.new(['show_parameters'], 'ask record', async (ctx) => {
	const p = ctx.fetch('show_parameters') as ShowRecordParameters;
	const validation = showParametersSchema.safeParse(p);
	if (!validation.success) return ctx.fail(validation.error);

	const { expand, fields, requestKey } = p;
	const options: RecordOptions = {};
	if (expand) options.expand = expand;
	if (fields) options.fields = fields;
	if (requestKey) options.requestKey = requestKey;
	try {
		const res = await pb.collection(p.collection).getOne(p.id, options);
		return ctx.pass(res);
	} catch (err) {
		return ctx.fail(err);
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

		const { expand, fields, requestKey } = r;
		const { collection, record } = p;

		const options: RecordOptions = {};
		if (expand) options.expand = expand;
		if (fields) options.fields = fields;
		if (requestKey) options.requestKey = requestKey;
		try {
			const res = await pb.collection(collection).create(record, options);
			return ctx.pass(res);
		} catch (err) {
			return ctx.fail(err.message);
		}
	},
);

export const pocketbase = p;
