// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type {
	ServerUrl,
	Credentials,
	DeleteRecordParameters,
	ListParameters,
	ShowRecordParameters,
	UpdateRecordParameters,
	RecordBaseParameters,
} from '@slangroom/pocketbase';
import { pocketbase } from '@slangroom/pocketbase';
import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { JsonableObject } from '@slangroom/shared';

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const email = "test@test.eu";
const password = "testtest";
const pb_address = "http://127.0.0.1:8090/" as ServerUrl;



const randomString = ()=>(Math.random() + 1).toString(36).substring(7);

test('should create a new slangroom client', async (t) => {
	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client and output into 'res'
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

test('should create a new slangroom capacitor client', async (t) => {
	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start capacitor pb client and output into 'res'
    Given I have a 'string' named 'res'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);
	const fn = slangroom.execute(script, {
		data: {
			pb_address,
		},
	});
	// check error from slangroom execution
	const error = await t.throwsAsync(fn);
	t.is(stripAnsiCodes((error as Error).message),
`1 |     Rule unknown ignore
2 |     Given I connect to 'pb_address' and start capacitor pb client and output into 'res'
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
3 |     Given I have a 'string' named 'res'
4 |     Then print data
Slangroom @slangroom/pocketbase Error: Can not start capacitor client in node environment
`);
});

test('should login with credentials', async (t) => {
	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
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
    Given I connect to 'pb_address' and start pb client
    Given I send list_parameters 'list_parameters' and get some records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters: JsonableObject } = {
		pb_address,
		list_parameters: {
			type: 'all',
			collection: 'organizations',
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
    Given I connect to 'pb_address' and start pb client
    Given I send list_parameters 'list_parameters' and get some records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters: ListParameters} = {
		pb_address,
		list_parameters: {
			type: 'list',
			pagination: {
				page: 2,
				perPage: 20,
			},
			collection: 'organizations',
		},
	}
	//Jsonable object dont like undefined values from list parameters
	const retypedData = data as unknown as JsonableObject
	const res = await slangroom.execute(script, {
		data:retypedData,
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
    Given I connect to 'pb_address' and start pb client
	Given I send my_credentials 'my_credentials' and login
    Given I send list_parameters 'list_parameters' and get some records and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; list_parameters:ListParameters, my_credentials: Credentials } = {
		pb_address,
		list_parameters: {
			type: 'first',
			collection: 'organizations',
			filter: 'created >= "2022-01-01 00:00:00"',
			sort: '-created',
		},
		my_credentials: {
			email,
			password
		}
	};
	//Jsonable object dont like undefined values from list parameters
	const retypedData = data as unknown as JsonableObject
	const res = await slangroom.execute(script, {
		data:retypedData,
	});
	t.truthy(res.result['output']);
});

test('should retrieve one record', async (t) => {
	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login
    Given I send show_parameters 'show_parameters' and get one record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

	const data: { pb_address: ServerUrl; show_parameters: ShowRecordParameters; my_credentials: Credentials } = {
		pb_address,
		show_parameters: {
			collection: 'organizations',
			id: 'p7viyzsihrn52uj',
			fields: 'name',
		},
		my_credentials: {
			email,
			password
		}
	};
	//Jsonable object dont like undefined values from ShowRecordParameters
	const retypedData = data as unknown as JsonableObject
	const res = await slangroom.execute(script, {
		data:retypedData,
	});
	const output = res.result['output'] as { name?: string };
	t.truthy(output.name);
});


test('should create a record', async (t) => {
    const name = `test-${randomString()}`

	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login
    Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);


	const data = {
		pb_address,
		create_parameters: {
			collection: 'organizations',
			record: {
				name,
			},
		},
		record_parameters: {
            requestKey: "testCreate",
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
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login and output into 'loginOutput'
	Given I have a 'string dictionary' named 'loginOutput'
	Given I have a 'string dictionary' named 'create_parameters'
	Given I have a 'string dictionary' named 'record_parameters'
	When I pickup from path 'loginOutput.record.id'
	and I pickup from path 'create_parameters.record'
	and I remove 'record' from 'create_parameters'
	and I move 'id' to 'owners' in 'record'
	and I move 'record' in 'create_parameters'
	Then print the 'create_parameters'
	Then print the 'record_parameters'
    Then I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    `;

	const scriptUpdate = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login
    Given I send update_parameters 'update_parameters' and send record_parameters 'record_parameters' and update record and output into 'output'
    Given I have a 'string dictionary' named 'output'
    Then print data
    `;
	const slangroom = new Slangroom(pocketbase);

    const dataCreate = {
		pb_address,
        create_parameters: {
			collection: 'organizations',
			record: {
				name: `test-created-${randomString()}`
			},
		},
		record_parameters: {
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
    const updatedName = `test-updated-${randomString()}`

	type DataUpdate = {
		pb_address: ServerUrl;
		update_parameters: UpdateRecordParameters;
		record_parameters: RecordBaseParameters;
		my_credentials: Credentials;
	};


    const dataUpdate:DataUpdate = {
		pb_address,
		update_parameters: {
			id: outputCreate.id,
			collection: 'organizations',
			record: {
				name: updatedName,
			},
		},
		record_parameters: {
            fields: "id, name"
        },
		my_credentials: {
			email,
			password,
		},
	};

	//Jsonable object dont like undefined values from ShowRecordParameters
	const retypedData = dataUpdate as unknown as JsonableObject
	const res = await slangroom.execute(scriptUpdate, {
		data:retypedData,
	});
	const output = res.result['output'] as { id?: string; name?: string };
	t.is(output.name, updatedName, res.logs);
});

test('should delete a record', async (t) => {
    const scriptCreate = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login and output into 'loginOutput'
	Given I have a 'string dictionary' named 'loginOutput'
	Given I have a 'string dictionary' named 'create_parameters'
	Given I have a 'string dictionary' named 'record_parameters'
	When I pickup from path 'loginOutput.record.id'
	and I pickup from path 'create_parameters.record'
	and I remove 'record' from 'create_parameters'
	and I move 'id' to 'owners' in 'record'
	and I move 'record' in 'create_parameters'
	Then print the 'create_parameters'
	Then print the 'record_parameters'
    Then I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'output'
    `;

	const script = `
    Rule unknown ignore
    Given I connect to 'pb_address' and start pb client
    Given I send my_credentials 'my_credentials' and login
    Given I send delete_parameters 'delete_parameters' and delete record and output into 'output'
    Given I have a 'string' named 'output'
    Then print data
    `;

    const dataCreate = {
		pb_address,
        create_parameters: {
			collection: 'organizations',
			record: {
				name: `test-${randomString()}`,
			},
		},
		record_parameters: {
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

test('should make a request', async (t) => {
	const script = `
	Rule unknown ignore
	Given I connect to 'pb_address' and start pb client
	Given I send my_credentials 'my_credentials' and login
	Given I send url 'url' and send send_parameters 'send_parameters' and send request and output into 'output'
	Given I have a 'string dictionary' named 'output'
	Then print data
	`;
	const slangroom = new Slangroom(pocketbase);

	const param = `user`

	const data = {
		pb_address,
		my_credentials: {
			email,
			password,
		},
		url: `/api/hello/${param}`,
		send_parameters: {
		}
	};

	const res = await slangroom.execute(script, {
		data,
	});

	// @ts-expect-error - Don't know the shape of the object in advance
	t.is(res.result['output']["message"], `Hello ${param}`);
});

