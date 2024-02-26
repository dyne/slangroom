import type {
	ServerUrl,
	ListParameters,
	CreateRecordParameters,
	Credentials,
	RecordBaseParameters,
	DeleteRecordParameters,
	UpdateRecordParameters,
	ShowRecordParameters,
} from '@slangroom/pocketbase';
import { pocketbase } from '@slangroom/pocketbase';
import test from 'ava';
import { Slangroom } from '@slangroom/core';

const email = "test@test.eu";
const password = "testtest";
const pb_address = "http://127.0.0.1:8090/" as ServerUrl;

type DataCreate = {
        create_parameters: CreateRecordParameters;
		pb_address: ServerUrl;
		my_credentials: Credentials;
		record_parameters: RecordBaseParameters;
	};

const randomString = ()=>(Math.random() + 1).toString(36).substring(7);

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
			pb_address,
		},
	});
	t.is(res.result['res'], 'pb client successfully created');
});

test('should login with credentials', async (t) => {
	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'gino' and login and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);
	const res = await slangroom.execute(script, {
		data: {
			pb_address,
			gino: {
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
		pb_address,
		list_parameters: {
			type: 'all',
			collection: 'organizations',
            expand: null,
            requestKey: null,
            fields: null,
            sort: null,
            filter: null
		},
	};
	const res = await slangroom.execute(script, {
		data: data,
	});
	t.truthy(res.result['output']);
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
		pb_address,
		list_parameters: {
			type: 'list',
			pagination: {
				page: 2,
				perPage: 20,
			},
            expand: null,
            requestKey: null,
            fields: null,
            sort: null,
            filter: null,
			collection: 'organizations',
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	const output = res.result['output'] as {
		records?: { items?: []; page?: string; perPage?: string};
	};
	t.truthy(Array.isArray(output.records?.items));
	t.is(output.records?.page, '2');
	t.is(output.records?.perPage, '20');
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
		pb_address,
		list_parameters: {
			type: 'first',
			collection: 'organizations',
			filter: 'created >= "2022-01-01 00:00:00"',
			sort: '-created',
            expand: null,
            requestKey: null,
            fields: null,
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	t.truthy(res.result['output']);
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
		pb_address,
		show_parameters: {
			collection: 'organizations',
			id: 'p7viyzsihrn52uj',
			fields: 'name',
            requestKey: null,
            expand:null
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	const output = res.result['output'] as { name?: string };
	t.truthy(output.name);
});


test('should create a record', async (t) => {
    const name = `test-${randomString()}`

	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);


	const data: DataCreate = {
		pb_address,
		create_parameters: {
			collection: 'organizations',
			record: {
				name,
			},
		},
		record_parameters: {
            expand: null,
            requestKey: "testCreate",
            fields: null
        },
		my_credentials: {
			email,
			password,
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	const output = res.result['output'] as { id?: string; name?: string };
	t.is(output.name, name, res.logs);
});

test('should update a record', async (t) => {


    const scriptCreate = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;

	const scriptUpdate = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send update_parameters 'update_parameters' and send record_parameters 'record_parameters' and update record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

    type DataUpdate = {
		pb_address: ServerUrl;
		update_parameters: UpdateRecordParameters;
		my_credentials: Credentials;
		record_parameters: RecordBaseParameters;
	};

    const dataCreate: DataCreate = {
		pb_address,
        create_parameters: {
			collection: 'organizations',
			record: {
				name: `test-${randomString()}`,
			},
		},
		record_parameters: {
            expand: null,
            requestKey: "testUpdateCreateContract",
            fields: "id, name"
        },
		my_credentials: {
			email,
			password,
		},
	};


    const createResult = await slangroom.execute(scriptCreate, {
        data: dataCreate
    })

    const outputCreate = createResult.result['output'] as { id: string, name: string}
    const updatedName = `test-${randomString()}`

    const dataUpdate: DataUpdate = {
		pb_address,
		update_parameters: {
			id: outputCreate.id,
			collection: 'organizations',
			record: {
				name: updatedName,
			},
		},
		record_parameters: {
            expand: null,
            requestKey: null,
            fields: "id, name"
        },
		my_credentials: {
			email,
			password,
		},
	};

	const res = await slangroom.execute(scriptUpdate, {
		data: dataUpdate,
	});
	const output = res.result['output'] as { id?: string; name?: string };
	t.is(output.name, updatedName, res.logs);
});

test('should delete a record', async (t) => {
    const scriptCreate = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;

	const script = `
    Rule unknown ignore
    Given I send pb_address 'pb_address' and create pb_client
    Given I send my_credentials 'my_credentials' and login
    Given I send delete_parameters 'delete_parameters' and delete record and output into 'output'
    Given I have a 'string' named 'output'
    Then print data
    `;

    const dataCreate: DataCreate = {
		pb_address,
        create_parameters: {
			collection: 'organizations',
			record: {
				name: `test-${randomString()}`,
			},
		},
		record_parameters: {
            expand: null,
            requestKey: "testDeleteCreateContract",
            fields: "id, name"
        },
		my_credentials: {
			email,
			password,
		},
	};

	const slangroom = new Slangroom(pocketbase);

    const createResult = await slangroom.execute(scriptCreate, {
        data: dataCreate
    })
    const outputCreate = createResult.result['output'] as { id: string, name: string}


	type Data = {
		pb_address: ServerUrl;
		delete_parameters: DeleteRecordParameters;
		my_credentials: Credentials;
	};

	const data: Data = {
		pb_address,
		delete_parameters: {
			collection: 'organizations',
			id: outputCreate.id,
		},
		my_credentials: {
			email,
			password,
		},
	};
	const res = await slangroom.execute(script, {
		data,
	});
	t.is(res.result['output'], 'deleted');
});
