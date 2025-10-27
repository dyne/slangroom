// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import jsonld from "jsonld";
import { canonize } from 'rdf-canonize';

// read the version from the package.json
import packageJson from '@slangroom/rdf/package.json' with { type: 'json' };

export const version = packageJson.version;

export class RdfError extends Error {
    constructor(e: string) {
        super(e)
        this.name = 'Slangroom @slangroom/rdf@' + packageJson.version + ' Error'
    }
}

const p = new Plugin();

export const rdfCanon = async (input: Record<string, unknown>): Promise<string> => {
	const quads = await jsonld.toRDF(input as object, {format: "application/n-quads"}) as string;
	const normalized: string = await canonize(quads, {
		algorithm: 'RDFC-1.0',
		inputFormat: 'application/n-quads'
	});
	return btoa(normalized);
}

/**
 * @internal
 */
export const canonicalization = p.new(
	['dictionary'],
	'generate serialized canonical rdf',
	async (ctx) => {
		const input = ctx.fetch('dictionary');
		if(!input || typeof input !== "object") {
			return ctx.fail(new RdfError('Invalid input, it must be an object'))
		}
		try {
			const canonResult = await rdfCanon(input as Record<string, unknown>);
			return ctx.pass(canonResult);
		} catch(e) {
			return ctx.fail(new RdfError((e as Error).message))
		}
	}
);

export const rdf = p;
