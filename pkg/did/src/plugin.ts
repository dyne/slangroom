// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';

import packageJson from '@slangroom/did/package.json' with { type: 'json' };

export const version = packageJson.version;

export class DidError extends Error {
    constructor(e: string) {
        super(e)
        this.name = 'Slangroom @slangroom/did@' + packageJson.version + ' Error'
    }
}

const p = new Plugin();

/**
 * @internal
 */
export const resolveDid = p.new(
	['did'],
	'resolve the did',
	async (ctx) => {
		const did = ctx.fetch('did');
		if (typeof did !== 'string') return ctx.fail(new DidError('did must be string'));
		if (!did.startsWith('did:')) return ctx.fail(new DidError('did must start with did:'));
		let resolutionUrl = 'https://dev.uniresolver.io/1.0/identifiers/';
		if (did.startsWith('did:dyne:')) {
			resolutionUrl = 'https://did.dyne.org/dids/';
		}
		resolutionUrl += did;

		try {
			const response = await fetch(resolutionUrl);
			if (!response.ok) return ctx.fail(new DidError(`resolution using ${resolutionUrl} failed: ${response.status} ${response.statusText}`));
			const data = await response.json();
			return ctx.pass(data);
		} catch (e) {
			return ctx.fail(new DidError(`resolution of ${did} failed: ${e.message}`));
		}
	}
)

export const did = p;
