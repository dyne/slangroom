import {
	ServerUrl,
	ListParameters,
	pocketbase,
	CreateRecordParameters,
	Credentials,
	RecordBaseParameters,
} from '@slangroom/pocketbase';
import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { ShowRecordParameters } from '../src/plugin.js';

const email = 'p@p.pp';
const password = 'pppppppp';

test('should create a new slangroom client', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client and output into 'res'
    Given I have a 'string' named 'res'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);
	const res = await slangroom.execute(script, {
		data: {
			pb_address: 'http://127.0.0.1:8090/',
		},
	});
	t.is(res.result['res'], 'pb client successfully created');
});

test('should login with credentials', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);
	const res = await slangroom.execute(script, {
		data: {
			pb_address: 'http://127.0.0.1:8090/',
			my_credentials: {
				email,
				password,
			},
		},
	});
	const output = res.result['output'] as { record?: { email?: string }; token?: string };
	t.is(output.record?.email, email);
	t.truthy(output.token);
});

test('should retrieve full list of records', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send list_parameters 'list_parameters' and ask records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters: ListParameters } = {
		pb_address: 'http://127.0.0.1:8090/',
		list_parameters: {
			type: 'all',
			collection: 'organizations',
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	t.truthy(res.result);
});

test('should retrieve paginated list of records', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send list_parameters 'list_parameters' and ask records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters: ListParameters } = {
		pb_address: 'http://127.0.0.1:8090/',
		list_parameters: {
			type: 'list',
			pagination: {
				page: 2,
				perPage: 20,
			},
			collection: 'organizations',
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	t.truthy(res.result);
});

test('should retrieve first record that match filters', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send list_parameters 'list_parameters' and ask records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters: ListParameters } = {
		pb_address: 'http://127.0.0.1:8090/',
		list_parameters: {
			type: 'first',
			collection: 'organizations',
			filter: 'created >= "2022-01-01 00:00:00"',
			sort: '-created',
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	//@ts-expect-error mm bib
	console.log(res.result['output']!.records);
	t.truthy(res.result);
});

test('should retrieve one record', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send show_parameters 'show_parameters' and ask record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; show_parameters: ShowRecordParameters } = {
		pb_address: 'http://127.0.0.1:8090/',
		show_parameters: {
			collection: 'organizations',
			id: 'ouja6pwgxuyn2sd',
			fields: 'name',
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	console.log(res.result['output']);
	t.truthy(res.result);
});

test('should create a record', async (t) => {
	const randomString = (Math.random() + 1).toString(36).substring(7);

	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	type Data = {
		pb_address: ServerUrl;
		create_parameters: CreateRecordParameters;
		my_credentials: Credentials;
		record_parameters: RecordBaseParameters;
	};
	const data: Data = {
		pb_address: 'http://127.0.0.1:8090/',
		create_parameters: {
			collection: 'organizations',
			record: {
				name: `test-${randomString}`,
			},
		},
		record_parameters: {},
		my_credentials: {
			email,
			password,
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	t.truthy(res.result);
	t.truthy(true);
});
