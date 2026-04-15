// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { zenroom_hash } from '@slangroom/deps/zenroom';
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
	return await canonize(quads, {
		algorithm: 'RDFC-1.0',
		inputFormat: 'application/n-quads'
	});
}

const binToHex = (bin: string) => {
	let hex = "";
	for (let i = 0; i < bin.length; i++) {
		hex += bin.charCodeAt(i).toString(16).padStart(2, "0");
	}
	return hex;
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
			return ctx.pass(btoa(canonResult));
		} catch(e) {
			return ctx.fail(new RdfError((e as Error).message))
		}
	}
);

/**
 * @internal
 */
export const credCanonicalization = p.new(
	['array'],
	'generate concatenated hash of serialized canonical rdf',
	async (ctx) => {
		const input = ctx.fetch('array') as {document: Record<string, unknown>, proof_config: Record<string, unknown>}[];
		if(!Array.isArray(input)) {
			return ctx.fail(new RdfError('Invalid input, it must be an an array'));
		}
		try {
			const result = await Promise.all(input.map(async (item) => {
				if(!item || typeof item !== "object" || !item.document || !item.proof_config) {
					throw new Error('Invalid input, it must be an object with entries "document" and "proof_config"');
				}

				// Run canonicalization + hashing in parallel
				const [docHash, proofHash] = await Promise.all([
					rdfCanon(item.document).then(docCanon => zenroom_hash('sha256', binToHex(docCanon))),
					rdfCanon(item.proof_config).then(proofCanon => zenroom_hash('sha256', binToHex(proofCanon)))
				]);

				const docBytes = Uint8Array.from(atob(docHash.result), c => c.charCodeAt(0));
				const proofBytes = Uint8Array.from(atob(proofHash.result), c => c.charCodeAt(0));
				const combined = new Uint8Array(docBytes.length + proofBytes.length);
				combined.set(proofBytes, 0);
				combined.set(docBytes, proofBytes.length);
				return btoa(String.fromCharCode(...combined));
			}));
			return ctx.pass(result);
		} catch(e) {
			return ctx.fail(new RdfError((e as Error).message));
		}
	}
);

export const rdf = p;
