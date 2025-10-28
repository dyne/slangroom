// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { zencodeExec } from '@slangroom/shared';
import { extractKey, es256kb, es256dcsdjwt } from './zencode.js';
import type { ExtractKeyOutput, Es256dcsdjwtOutput, JWK } from './types.js';

async function fetchIssuerJwk(issuerUrl: string): Promise<JWK> {
	const response = await fetch(issuerUrl);
	if (!response.ok)
		throw new Error(`Invalid credential: issuer well-known not found at ${issuerUrl}`);
	const wk = await response.json();
	let jwks: { keys: JWK[] };
	if (wk.jwks) {
		jwks = wk.jwks;
	} else {
		// is there a default url to check? /jwks, /.well-known/jwks?
		const jwksResponse = await fetch(wk.jwks_uri);
		if (!jwksResponse.ok) throw new Error(`Invalid credential issuer: jwks not found anywhere`);
		jwks = await response.json();
	}
	const k = jwks.keys[0];
	if (!k) throw new Error('Invalid credential issuer: jwk used to signed not found');
	return k;
}

function flattenDcAndPayload(
	disclosures: [string, string, string | boolean | number][],
	payload: Record<string, unknown>,
) {
	const result: Record<string, string | boolean | number> = {};
	function flatten(path: string, value: unknown): void {
		if (typeof value === 'object') {
			if (Array.isArray(value)) {
				value.forEach((v, i) => flatten(`${path}.${i}`, v));
			} else {
				for (const key in value) {
					flatten(`${path}.${key}`, (value as Record<string, unknown>)[key]);
				}
			}
		} else if (value && ['string', 'number', 'boolean'].includes(typeof value)) {
			result[path] = value as string | boolean | number;
		}
	}
	// Handle disclosures
	disclosures.forEach((disclosure) => {
		const [_, firstKey, thirdElement] = disclosure;
		let parsed;
		try {
			parsed = typeof thirdElement === 'string' ? JSON.parse(thirdElement) : thirdElement;
		} catch {
			parsed = thirdElement; // Not JSON
		}
		flatten(firstKey, parsed);
	});

	// Handle payload
	for (const key in payload) {
		flatten(key, payload[key]);
	}
	return result;
}

export const parseDcSdJwt = async (dcSdJwtKb: string) => {
	const extractKeyOut = (await zencodeExec(extractKey, {
		data: { credential: dcSdJwtKb },
		keys: {},
	})) as ExtractKeyOutput;
	// holder key binding
	const parts = dcSdJwtKb.split('~');
	if (parts.length < 2) throw new Error('Invalid credential: disclosuers not found in dc+sd-jwt');
	const kb = parts.at(-1);
	const credential = parts.slice(0, -1).join(`~`) + '~';
	if (extractKeyOut.result.jwk.crv === 'P-256') {
		await zencodeExec(es256kb, {
			data: {
				x: extractKeyOut.result.jwk.x!,
				y: extractKeyOut.result.jwk.y!,
				kb: kb!,
				credential: credential,
			},
			keys: {},
		});
	} else {
		throw new Error('Invalid credential: holder key type not yet supported');
	}
	// issuer signature
	const issJwk = await fetchIssuerJwk(extractKeyOut.result.iss);
	let res;
	if (issJwk.crv === 'P-256') {
		const result = (await zencodeExec(es256dcsdjwt, {
			data: {
				credential,
				jwk: issJwk,
			},
			keys: {},
		})) as Es256dcsdjwtOutput;
		res = result.result;
	} else {
		throw new Error('Invalid credential: issuer key type not yet supported');
	}
	// expired credential
	const now = Math.floor(Date.now() / 1000);
	if (typeof res.payload['exp'] !== 'number' || res.payload['exp'] < now) {
		throw new Error('Invalid credential: expired');
	}
	return {
		credential_format: 'dc+sd-jwt',
		vct: res.payload['vct'] || res.payload['type'],
		claims: flattenDcAndPayload(res.disclosures, res.payload),
		cryptographic_holder_binding: true,
	};
};
