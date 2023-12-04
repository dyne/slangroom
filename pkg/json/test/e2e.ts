import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { json, SENTENCE_VALIDATE_JSON, ValidationError } from '@slangroom/json';

const KEY_DATA = 'data';
const KEY_SCHEMA = 'schema';
const KEY_OUTPUT = 'out';
const SENTENCE = SENTENCE_VALIDATE_JSON(KEY_DATA, KEY_SCHEMA, KEY_OUTPUT);

test('validate valid data with valid schema', async (t) => {
	const script = `
	Rule unknown ignore

	${SENTENCE}
	Then print data
	`;

	const slangroom = new Slangroom(json);

	const res = await slangroom.execute(script, {
		data: {
			[KEY_DATA]: 'nice',
			[KEY_SCHEMA]: {
				type: 'string',
			},
		},
	});

	const output = res.result[KEY_OUTPUT] as unknown as { errors: ValidationError[] };
	t.deepEqual(output.errors, []);
});

test('validate invalid data with valid schema', async (t) => {
	const script = `
	Rule unknown ignore

	${SENTENCE}
	Then print data
	`;

	const slangroom = new Slangroom(json);

	const res = await slangroom.execute(script, {
		data: {
			[KEY_DATA]: 12,
			[KEY_SCHEMA]: {
				type: 'string',
			},
		},
	});

	const output = res.result[KEY_OUTPUT] as unknown as { errors: ValidationError[] };
	t.true(Array.isArray(output.errors) && output.errors.length > 0);
});

test('load invalid schema', async (t) => {
	const script = `
	Rule unknown ignore

	${SENTENCE}
	Then print data
	`;

	const slangroom = new Slangroom(json);

	let error;
	try {
		await slangroom.execute(script, {
			data: {
				[KEY_DATA]: 12,
				[KEY_SCHEMA]: {
					invalid_key: 'string',
				},
			},
		});
	} catch (e) {
		error = 'Invalid JSON schema';
	}

	t.assert(error);
});
