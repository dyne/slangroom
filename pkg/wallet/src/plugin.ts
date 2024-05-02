// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import {
	base64encode,
	decodeJWT,
	type DisclosureFrame,
	type Hasher,
	type KeyBindingVerifier,
	type Signer,
} from '@meeco/sd-jwt';
import { createHash } from 'crypto';
import {
	SignJWT,
	exportJWK,
	importJWK,
	generateKeyPair,
	jwtVerify,
	type JWTHeaderParameters,
	type JWTPayload,
	type KeyLike,
	type JWK,
} from 'jose';
import {
	Holder,
	Issuer,
	Verifier,
	defaultHashAlgorithm,
	supportedAlgorithm,
	type SignerConfig,
	type CreateSDJWTPayload,
	type HasherConfig,
	type VCClaims,
} from '@meeco/sd-jwt-vc';
import type { JsonableArray, JsonableObject } from '@slangroom/shared';

const hasherCallbackFn = (alg: string = defaultHashAlgorithm): Hasher => {
	return (data: string): string => {
		const digest = createHash(alg).update(data).digest();
		return base64encode(digest);
	};
};

const signerCallbackFn = (privateKey: Uint8Array | KeyLike): Signer => {
	return async (protectedHeader: JWTHeaderParameters, payload: JWTPayload): Promise<string> => {
		return (
			(await new SignJWT(payload).setProtectedHeader(protectedHeader).sign(privateKey))
				.split('.')
				.pop() || ''
		);
	};
};

const hasher: HasherConfig = {
	alg: 'sha256',
	callback: hasherCallbackFn('sha256'),
};

const keyBindingVerifierCallbackFn = (): KeyBindingVerifier => {
	return async (kbjwt: string, holderJWK: JWK) => {
		const { header } = decodeJWT(kbjwt);

		if (!Object.values(supportedAlgorithm).includes(header.alg as supportedAlgorithm)) {
			throw new Error('unsupported algorithm');
		}

		const holderKey = await importJWK(holderJWK, header.alg);
		const verifiedKbJWT = await jwtVerify(kbjwt, holderKey);
		return !!verifiedKbJWT;
	};
};

const verifierCallbackFn = (publicKey: Uint8Array | KeyLike) => {
	return async (jwt: string): Promise<boolean> => {
		const verifiedKbJWT = await jwtVerify(jwt, publicKey);
		return !!verifiedKbJWT;
	};
};

const kbVerifierCallbackFn = (expectedAud: string, expectedNonce: string): KeyBindingVerifier => {
	return async (kbjwt: string, holderJWK: JWK) => {
		const { header, payload } = decodeJWT(kbjwt);

		if (expectedAud || expectedNonce) {
			if (payload.aud !== expectedAud) {
				throw new Error('aud mismatch');
			}
			if (payload['nonce'] !== expectedNonce) {
				throw new Error('nonce mismatch');
			}
		}

		if (!Object.values(supportedAlgorithm).includes(header.alg as supportedAlgorithm)) {
			throw new Error('unsupported algorithm');
		}

		const holderKey = await importJWK(holderJWK, header.alg);
		const verifiedKbJWT = await jwtVerify(kbjwt, holderKey);
		return !!verifiedKbJWT;
	};
};

const p = new Plugin();

/**
 * @internal
 */
export const createVcSdJwt = p.new(
	['jwk', 'object', 'holder', 'fields'],
	'create vc sd jwt',
	async (ctx) => {
		// TODO: typecheck jwt
		const sk = ctx.fetch('jwk') as JsonableObject;
		// TODO: typecheck object
		const object = ctx.fetch('object') as JsonableObject;
		// TODO: typecheck holder
		const holder = ctx.fetch('holder') as JsonableObject;
		// TODO: typecheck fields
		const fields = ctx.fetch('fields') as JsonableArray;

		const payload: CreateSDJWTPayload = {
			iat: Date.now(),
			cnf: { jwk: holder },
			iss: 'https://valid.issuer.url',
		};
		const vcClaims: VCClaims = {
			type: 'VerifiableCredential',
			status: { idx: 'statusIndex', uri: 'https://valid.status.url' },
			object: object,
		};
		const sdVCClaimsDisclosureFrame: DisclosureFrame = { object: { _sd: fields } };

		let result
		try {
			// TODO: generate in another statement
			const signer: SignerConfig = {
				alg: supportedAlgorithm.ES256,
				callback: signerCallbackFn(await importJWK(sk)),
			};
			const issuer = new Issuer(signer, hasher);
			result = await issuer.createVCSDJWT(vcClaims, payload, sdVCClaimsDisclosureFrame);
		} catch (e) {
			return ctx.fail(e);
		}
		return ctx.pass(result);
	},
);

/**
 * @internal
 */
export const presentVcSdJwt = p.new(
	['verifier_url', 'issued_vc', 'disclosed', 'nonce', 'holder'],
	'present vc sd jwt',
	async (ctx) => {
		const verifierUrl = ctx.fetch('verifier_url');
		if (typeof verifierUrl !== 'string') return ctx.fail('verifier_url must be string');
		const issuedVc = ctx.fetch('issued_vc');
		if (typeof issuedVc !== 'string') return ctx.fail('issued_vc must be string');
		const nonce = ctx.fetch('nonce') as string;
		if (typeof nonce !== 'string') return ctx.fail('nonce must be string');
		// TODO: typecheck disclosed
		const disclosed = ctx.fetch('disclosed') as JsonableObject[];
		// TODO: typecheck holderSk
		const holderSk = ctx.fetch('holder') as JsonableObject;

		const disclosureList = [];
		const tildeTokens = issuedVc.split('~');
		for (let i = 1; i < tildeTokens.length; ++i) {
			const encoded = tildeTokens[i];
			if (!encoded) continue;
			const disclose = JSON.parse(atob(encoded));
			if (!disclosed.includes(disclose[1])) continue;
			disclosureList.push({
				key: disclose[1],
				value: disclose[2],
				disclosure: encoded,
			});
		}

		let vcSDJWTWithkeyBindingJWT
		try {
			const signer: SignerConfig = {
				alg: supportedAlgorithm.ES256,
				callback: signerCallbackFn(await importJWK(holderSk))
			};
			const holder = new Holder(signer);
			({ vcSDJWTWithkeyBindingJWT } = await holder.presentVCSDJWT(issuedVc, disclosureList, {
				nonce: nonce,
				audience: verifierUrl,
				keyBindingVerifyCallbackFn: keyBindingVerifierCallbackFn(),
			}));
		} catch (e) {
			return ctx.fail(e);
		}
		return ctx.pass(vcSDJWTWithkeyBindingJWT);
	},
);

/**
 * @internal
 */
export const verifyVcSdJwt = p.new(
	['verifier_url', 'issued_vc', 'nonce', 'issuer'],
	'verify vc sd jwt',
	async (ctx) => {
		const verifierUrl = ctx.fetch('verifier_url');
		if (typeof verifierUrl !== 'string') return ctx.fail('verifier_url must be string');
		const issuedVc = ctx.fetch('issued_vc');
		if (typeof issuedVc !== 'string') return ctx.fail('issued_vc must be string');
		const nonce = ctx.fetch('nonce');
		if (typeof nonce !== 'string') return ctx.fail('nonce must be string');
		// TODO: typecheck issuer
		const issuer = ctx.fetch('issuer') as JsonableObject;

		const verifier = new Verifier();
		let result
		try {
			result = await verifier.verifyVCSDJWT(
				issuedVc,
				verifierCallbackFn(await importJWK(issuer)),
				hasherCallbackFn(defaultHashAlgorithm),
				kbVerifierCallbackFn(verifierUrl, nonce),
			);
		} catch (e) {
			return ctx.fail(e);
		}
		return ctx.pass(result as JsonableObject);
	},
);

/**
 * @internal
 */
export const keyGen = p.new('create p-256 key', async (ctx) => {
	// Elliptic Curve Digital Signature Algorithm with the P-256 curve and the SHA-256 hash function
	let sk
	try {
		sk = await exportJWK((await generateKeyPair(supportedAlgorithm.ES256)).privateKey);
	} catch (e) {
		return ctx.fail(e);
	}

	return ctx.pass({
		kty: sk.kty || 'EC',
		crv: sk.crv || 'P-256',
		x: sk.x || '',
		y: sk.y || '',
		d: sk.d || '',
	});
});

/**
 * @internal
 */
export const pubGen = p.new(['sk'], 'create p-256 public key', async (ctx) => {
	// TODO: typecheck sk
	const sk = ctx.fetch('sk') as JsonableObject;

	return ctx.pass({
		kty: (sk['kty'] as string) || '',
		x: (sk['x'] as string) || '',
		y: (sk['y'] as string) || '',
		crv: (sk['crv'] as string) || '',
	});
});

export const prettyPrintSdJwt = p.new(['token'], 'pretty print sd jwt', async (ctx) => {
	const jwt = ctx.fetch('token');
	if (typeof jwt !== 'string') return ctx.fail('token must be string');
	const tokens = jwt.split('~');
	const res = [];
	const tryDecode = (s: string) => {
		try {
			return JSON.parse(atob(s));
		} catch (e) {
			return s;
		}
	};
	for (let i = 0; i < tokens.length; ++i) {
		if (tokens[i]) {
			const parts = tokens[i]?.split('.') || [];
			if (parts.length == 1) res.push(tryDecode(parts[0] || ''));
			else res.push(parts.map(tryDecode) || []);
		}
	}
	return ctx.pass(res);
});

export const wallet = p;
