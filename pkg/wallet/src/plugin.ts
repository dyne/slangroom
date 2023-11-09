import type { Plugin, PluginContext, PluginResult } from '@slangroom/core';
import { parser } from '@slangroom/wallet';

import { DisclosureFrame, Hasher, KeyBindingVerifier, Signer, base64encode, decodeJWT } from '@meeco/sd-jwt';
import { createHash } from 'crypto';
import { JWTHeaderParameters, JWTPayload, KeyLike, SignJWT, exportJWK, importJWK, generateKeyPair, JWK, jwtVerify } from 'jose';
import {
	CreateSDJWTPayload,
	HasherConfig,
	Holder,
	Issuer,
	SignerConfig,
	VCClaims,
	Verifier,
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

const keyBindingVerifierCallbackFn = function (): KeyBindingVerifier {
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

function verifierCallbackFn(publicKey: Uint8Array | KeyLike) {
	return async (jwt: string): Promise<boolean> => {
		const verifiedKbJWT = await jwtVerify(jwt, publicKey);
		return !!verifiedKbJWT;
	};
}

function kbVeriferCallbackFn(expectedAud: string, expectedNonce: string): KeyBindingVerifier {
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
}

const createVCSDJWT = async (ctx: PluginContext): Promise<PluginResult> => {
	const sk = ctx.fetch('jwk') as JsonableObject
	const object = ctx.fetch('object') as JsonableObject
	const holder = ctx.fetch('holder') as JsonableObject
	const fields = ctx.fetch('fields') as JsonableArray
	// TODO: generate in another statement
	const signer: SignerConfig = {
		alg: supportedAlgorithm.ES256,
		callback: signerCallbackFn(await importJWK(sk)),
	};
	const issuer = new Issuer(signer, hasher);


	const payload: CreateSDJWTPayload = {
		iat: Date.now(),
		cnf: {
			jwk: holder,
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


const presentVCSDJWT = async (ctx: PluginContext): Promise<PluginResult> => {
	const verifierUrl = ctx.fetch('verifier url') as string
	const issuedVc = ctx.fetch('issued vc') as string
	const disclosed = ctx.fetch('disclosed') as JsonableObject[]
	const nonce = ctx.fetch('nonce') as string
	const holderSk = ctx.fetch('holder') as JsonableObject

	const pk = await importJWK(holderSk);
	const disclosureList = []

	const tildeTokens = issuedVc.split("~")

	for(let i = 1; i < tildeTokens.length; i++) {
		const encoded = tildeTokens[i] || "";
		if(!encoded) {
			continue
		}
		const disclose = JSON.parse(atob(encoded))
		if(!disclosed.includes(disclose[1])) {
			continue
		}
		disclosureList.push({
			key: disclose[1],
			value: disclose[2],
			disclosure: encoded,
		})
	}

	const signer: SignerConfig = {
		alg: supportedAlgorithm.ES256,
		callback: signerCallbackFn(pk),
	};
	const holder = new Holder(signer);

	const { vcSDJWTWithkeyBindingJWT } = await holder.presentVCSDJWT(issuedVc, disclosureList, {
		nonce: nonce,
		audience: verifierUrl,
		keyBindingVerifyCallbackFn: keyBindingVerifierCallbackFn(),
	});
	return ctx.pass(vcSDJWTWithkeyBindingJWT);
}

const verifyVCSDJWT = async (ctx: PluginContext): Promise<PluginResult> => {
	const verifierUrl = ctx.fetch('verifier url') as string
	const issuedVc = ctx.fetch('issued vc') as string
	const nonce = ctx.fetch('nonce') as string
	const issuer = ctx.fetch('issuer') as JsonableObject
	const issuerPubKey = await importJWK(issuer)

	const verifier = new Verifier();

	const result = await verifier.verifyVCSDJWT(
		issuedVc,
		verifierCallbackFn(issuerPubKey),
		hasherCallbackFn(defaultHashAlgorithm),
		kbVeriferCallbackFn(verifierUrl, nonce),
	);
	return ctx.pass(result as JsonableObject)
}

const keyGen = async (ctx: PluginContext) : Promise<PluginResult> => {
	// Elliptic Curve Digital Signature Algorithm with the P-256 curve and the SHA-256 hash function
	const keyPair = await generateKeyPair(supportedAlgorithm.ES256);

	const sk = await exportJWK(keyPair.privateKey)

	return ctx.pass({
		kty: sk.kty || "EC",
		crv: sk.crv || "P-256",
		x: sk.x || "",
		y: sk.y || "",
		d: sk.d || ""
	})
}

const pubGen = async (ctx: PluginContext) : Promise<PluginResult> => {
	const sk = ctx.fetch('sk') as JsonableObject

	return ctx.pass({
		kty: (sk['kty'] as string) || "",
		x: (sk['x'] as string) || "",
		y: (sk['y'] as string) || "",
		crv: (sk['crv'] as string) || "",
	})
}

const prettyPrintSdJwt = async (ctx: PluginContext) : Promise<PluginResult> => {
	const jwt = ctx.fetch('token') as string;
	const tokens = jwt.split("~");
	const result = []
	const tryDecode = (s: string) => {
		try {
			return JSON.parse(atob(s));
		} catch (e) {
			return s;
		}
	}
	for(let i=0; i<tokens.length; i++) {
		if(tokens[i]) {
			const parts = tokens[i]?.split(".") || []
			if(parts.length == 1) {
				result.push(tryDecode(parts[0] || ""))
			} else {
				result.push(parts.map(tryDecode) || [])
			}
		}
	}
	return ctx.pass(result);

}

export const wallet: Plugin = {
	parser: parser,
	executor: async (ctx) => {
		switch (ctx.phrase) {
			case 'create vc sd jwt':
				return await createVCSDJWT(ctx);
			case 'present vc sd jwt':
				return await presentVCSDJWT(ctx);
			case 'verify vc sd jwt':
				return await verifyVCSDJWT(ctx);
			case 'create p-256 key':
				return await keyGen(ctx);
			case 'create p-256 public key':
				return await pubGen(ctx);
			case 'pretty print sd jwt':
				return await prettyPrintSdJwt(ctx);
			default:
				return ctx.fail('no match');
		}
	},
};
