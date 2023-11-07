import type { Plugin, PluginContext, PluginResult } from '@slangroom/core';
import { parser } from '@slangroom/wallet';

import bs58 from 'bs58'
import { DisclosureFrame, Hasher, Signer, base64encode } from '@meeco/sd-jwt';
import { createHash } from 'crypto';
import { JWTHeaderParameters, JWTPayload, KeyLike, SignJWT, exportJWK, importJWK } from 'jose';
import {
	CreateSDJWTPayload,
	HasherConfig,
	Issuer,
	SignerConfig,
	VCClaims,
	defaultHashAlgorithm,
	supportedAlgorithm,
} from '@meeco/sd-jwt-vc';
import { JsonableArray, JsonableObject } from '@slangroom/shared';

const hasherCallbackFn = function (alg: string = defaultHashAlgorithm): Hasher {
	return (data: string): string => {
		const digest = createHash(alg).update(data).digest();
		return base64encode(digest);
	};
};

const signerCallbackFn = function (privateKey: Uint8Array | KeyLike): Signer {
	return async (protectedHeader: JWTHeaderParameters, payload: JWTPayload): Promise<string> => {
		return (await new SignJWT(payload).setProtectedHeader(protectedHeader).sign(privateKey)).split('.').pop() || "";
	};
};
const hasher: HasherConfig = {
    alg: 'sha256',
    callback: hasherCallbackFn('sha256'),
  };

const createVCSDJWT = async (ctx: PluginContext): Promise<PluginResult> => {
	const jwk = ctx.fetch('jwk') as JsonableObject
	const object = ctx.fetch('object') as JsonableObject
	const holder = ctx.fetch('holder') as string
	const fields = ctx.fetch('fields') as JsonableArray
	// TODO: generate in another statement
	const sk = await importJWK(jwk)
	const signer: SignerConfig = {
		alg: supportedAlgorithm.EdDSA,
		callback: signerCallbackFn(sk),
	};
	const issuer = new Issuer(signer, hasher);


	const holderPublicKey = await exportJWK(bs58.decode(holder));

	const payload: CreateSDJWTPayload = {
		iat: Date.now(),
		cnf: {
			jwk: holderPublicKey,
		},
		iss: 'https://valid.issuer.url',
	};
	const vcClaims: VCClaims = {
		type: 'VerifiableCredential',
		status: {
		idx: 'statusIndex',
		uri: 'https://valid.status.url',
		},
		object
	};

	const sdVCClaimsDisclosureFrame: DisclosureFrame = { object: { _sd: fields } };

	const result = await issuer.createVCSDJWT(vcClaims, payload, sdVCClaimsDisclosureFrame);

	return ctx.pass(result);
}

export const wallet: Plugin = {
	parser: parser,
	executor: async (ctx) => {
		switch (ctx.phrase) {
			case 'create vc sd jwt':
				return await createVCSDJWT(ctx);
			default:
				return ctx.fail('no match');
		}
	},
};
