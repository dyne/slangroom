// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { HTTP } from "@cerbos/http";
// read the version from the package.json
import packageJson from '@slangroom/cerbos/package.json' with { type: 'json' };
import { actionSchema, principalSchema, resourceSchema } from './types.js';

export const version = packageJson.version;

export class CerbosError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/cerbos@' + packageJson.version + ' Error';
	}
};

const p = new Plugin();

/**
 * @internal
 */
export const allowed = p.new('connect',
	['principal', 'resource', 'action'],
	'evaluate access',
	async (ctx) => {
		const cerbosUrl = ctx.fetchConnect()[0];
		const { success: principalIsValid, data: principal } = principalSchema.safeParse(ctx.fetch("principal"));
		if (!principalIsValid)
			return ctx.fail(new CerbosError("Principal is not valid"));
		const { success: resourceIsValid, data: resource } = resourceSchema.safeParse(ctx.fetch("resource"));
		if (!resourceIsValid)
			return ctx.fail(new CerbosError("Resource is not valid"));
		const { success: actionIsValid, data: action } = actionSchema.safeParse(ctx.fetch("action"));
		if (!actionIsValid)
			return ctx.fail(new CerbosError("Action is not valid"));
		try {
			const cerbos = new HTTP(cerbosUrl);
			const result = await cerbos.isAllowed({
				principal,
				resource,
				action,
			});
			return ctx.pass(result);
		} catch (e) {
			return ctx.fail(new CerbosError(e.message));
		}
	}
)

export const cerbos = p;
