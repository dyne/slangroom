import { Plugin } from '@slangroom/core';
import Ajv, { type ValidationError } from 'ajv';

export { ValidationError };

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
		const schema = ctx.fetch(ARG_JSON_SCHEMA);

		try {
			const ajv = new Ajv.default({ allErrors: true });

			// @ts-ignore
			const validate = ajv.compile(schema);
			validate(data);

			// @ts-ignore
			return ctx.pass({
				errors: validate.errors ?? [],
			});
		} catch (e) {
			console.log(e.message);
			return ctx.fail('JSON Schema not valid' + e);
		}
	},
);

export const JSONSchema = p;
