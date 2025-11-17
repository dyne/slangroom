// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import type { JsonableObject } from '@slangroom/shared';
import { DcqlQuery, DcqlPresentationResult } from 'dcql';
import { parseDcSdJwt } from './dcsdjwt.js';
import { parseLdpVc } from './ldpvc.js';
import { VpTokenSchema, DcSdJwtArraySchema, LdpVcArraySchema, type VpToken } from './types.js';
import packageJson from '@slangroom/dcql/package.json' with { type: 'json' };

/*
 * plugin
 */
const p = new Plugin();

/*
 * custom error
 */
export const version = packageJson.version;
export class DcqlError extends Error {
	constructor(e: string) {
		super(e);
		this.name = 'Slangroom @slangroom/dcql@' + version + ' Error';
	}
}

/**
 * @internal
 */
export const validateVpToken = p.new(
	['dcql_query', 'vp_token'],
	'validate the vp_token against dcql_query',
	async (ctx) => {
		const stringVpToken = ctx.fetch('vp_token');
		if (typeof stringVpToken !== 'string')
			return ctx.fail(new DcqlError('Invalid vp_token: it must be a string'));
		let jsonVpToken: VpToken;
		try {
			jsonVpToken = JSON.parse(stringVpToken);
			VpTokenSchema.parse(jsonVpToken);
		} catch {
			return ctx.fail(new DcqlError('Invalid vp_token: it must be an encoded JSON'));
		}
		const dcqlQuery = ctx.fetch('dcql_query');
		if (typeof dcqlQuery !== 'object')
			return ctx.fail(new DcqlError('Invalid dcql_query: it must be an object'));
		let parsedDcqlQuery;
		try {
			parsedDcqlQuery = DcqlQuery.parse(dcqlQuery as DcqlQuery.Input);
			// @ts-expect-error – credential_sets can be undefined at runtime
			DcqlQuery.validate(parsedDcqlQuery);
		} catch (e) {
			return ctx.fail(new DcqlError(`Invalid dcql_query: ${e.message}`));
		}

		try {
			const parsedPresentation = Object.fromEntries(
				await Promise.all(
					Object.entries(jsonVpToken).map(async ([key, values]) => {
						const credentialFormat = parsedDcqlQuery.credentials.find(
							(obj) => obj.id === key,
						)?.format;
						let parsedValues;
						switch (credentialFormat) {
							case 'dc+sd-jwt': {
								const sdJwtValues = DcSdJwtArraySchema.parse(values);
								parsedValues = await Promise.all(
									sdJwtValues.map((value: string) => parseDcSdJwt(value)),
								);
								break;
							}
							case 'ldp_vc': {
								const ldpVcValues = LdpVcArraySchema.parse(values);
								parsedValues = await Promise.all(
									ldpVcValues.map((value) => parseLdpVc(value)),
								);
								break;
							}
							default: {
								const err = credentialFormat
									? `${credentialFormat} not supported`
									: `credential format not found for ${key}`;
								throw new Error(`Invalid vp_token: ${err}`);
							}
						}
						return [key, parsedValues];
					}),
				),
			);
			const presentationQueryResult = DcqlPresentationResult.fromDcqlPresentation(
				parsedPresentation,
				// @ts-expect-error – credential_sets can be undefined at runtime
				{ dcqlQuery: parsedDcqlQuery },
			);
			if (!presentationQueryResult.can_be_satisfied)
				throw new Error(`Invalid vp_token: it does not satisfy the dcql_query: \n${JSON.stringify(presentationQueryResult, null, 2)}`);
			const result: Record<string, unknown> = {}
			for (const [key, match] of Object.entries(presentationQueryResult.credential_matches)) {
				const outputs: Record<string, unknown>[] = [];
				match.valid_credentials?.forEach(vc => {
					vc.claims?.valid_claim_sets?.forEach(vcs => {
						if (vcs.output) outputs.push(vcs.output);
					});
				});
				result[key] = outputs;
			}
			return ctx.pass(result as JsonableObject);
		} catch (e) {
			return ctx.fail(new DcqlError(e.message));
		}
	},
);

export const dcql = p;
