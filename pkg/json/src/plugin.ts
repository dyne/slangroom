import { Plugin } from '@slangroom/core';
// import type { JsonableArray, JsonableObject } from '@slangroom/shared';

// 

const p = new Plugin();

/**
 * @internal
 */
export const createVcSdJwt = p.new(
	['jwk', 'object', 'holder', 'fields'],
	'create vc sd jwt',
	async (ctx) => {
		// // TODO: typecheck jwt
		// const sk = ctx.fetch('jwk') as JsonableObject;
		// // TODO: typecheck object
		// const object = ctx.fetch('object') as JsonableObject;
		// // TODO: typecheck holder
		// const holder = ctx.fetch('holder') as JsonableObject;
		// // TODO: typecheck fields
		// const fields = ctx.fetch('fields') as JsonableArray;
		// // TODO: generate in another statement
		// const signer: SignerConfig = {
		// 	alg: supportedAlgorithm.ES256,
		// 	callback: signerCallbackFn(await importJWK(sk)),
		// };

		// const issuer = new Issuer(signer, hasher);

		// const payload: CreateSDJWTPayload = {
		// 	iat: Date.now(),
		// 	cnf: { jwk: holder },
		// 	iss: 'https://valid.issuer.url',
		// };
		// const vcClaims: VCClaims = {
		// 	type: 'VerifiableCredential',
		// 	status: { idx: 'statusIndex', uri: 'https://valid.status.url' },
		// 	object: object,
		// };

		// const sdVCClaimsDisclosureFrame: DisclosureFrame = { object: { _sd: fields } };

		// const result = await issuer.createVCSDJWT(vcClaims, payload, sdVCClaimsDisclosureFrame);

		return ctx.pass("");
	},
);

export const json = p;
