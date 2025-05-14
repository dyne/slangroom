// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { Ajv, type ValidationError, type AnySchema } from 'ajv';
import type { Jsonable } from '@slangroom/shared';
// read the version from the package.json
import packageJson from '@slangroom/json-schema/package.json' with { type: 'json' };

export const version = packageJson.version;

export { ValidationError };

export class JsonSchemaError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/json-schema@' + packageJson.version + ' Error';
	}
}

//

const p = new Plugin();

export const ARG_JSON_DATA = 'json_data';
export const ARG_JSON_SCHEMA = 'json_schema';
export const PHRASE_VALIDATE_JSON = 'validate json';

export const SENTENCE_VALIDATE_JSON = (dataKey: string, schemaKey: string, outputKey: string) =>
	`Given I send ${ARG_JSON_DATA} '${dataKey}' and send ${ARG_JSON_SCHEMA} '${schemaKey}' and ${PHRASE_VALIDATE_JSON} and output into '${outputKey}'
Given I have a 'string dictionary' named '${outputKey}'`;

/**
 * @internal
 */
export const validateJSON = p.new(
	[ARG_JSON_DATA, ARG_JSON_SCHEMA],
	PHRASE_VALIDATE_JSON,
	async (ctx) => {
		const data = ctx.fetch(ARG_JSON_DATA);
		const schema = ctx.fetch(ARG_JSON_SCHEMA) as AnySchema;

		try {
			const ajv = new Ajv({ allErrors: true });

			const validate = ajv.compile(schema);
			validate(data);

			return ctx.pass({
				errors: validate.errors as unknown as Jsonable[] ?? [],
			});
		} catch (e) {
			return ctx.fail(new JsonSchemaError('JSON Schema not valid' + e.message));
		}
	},
);

export const JSONSchema = p;
