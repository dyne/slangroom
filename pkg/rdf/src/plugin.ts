// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import n3 from "n3";
import jsonld from "jsonld";
import { RDFC10, type InputQuads } from 'rdfjs-c14n';

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

const rdfc10 = new RDFC10(n3.DataFactory);

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
			const quads = await jsonld.toRDF(input as object, {format: "application/n-quads"}) as unknown as InputQuads;
			const normalized: string = (await rdfc10.c14n(quads)).canonical_form
			return ctx.pass(btoa(normalized));
		} catch(e) {
			return ctx.fail(new RdfError((e as Error).message))
		}
	}
);

export const rdf = p;
