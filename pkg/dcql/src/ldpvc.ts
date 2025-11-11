// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { zencodeExec } from '@slangroom/shared';
import { rdfCanon } from '@slangroom/rdf';
import { es256kb_ldpvc } from './zencode.js';
import type { LdpVcElementType, LdpVcVerifiableCredentialelementType } from './types.js';

const resolveDid = async (did: string) => {
	if (!did.startsWith('did:'))
		throw new Error('Invalid presentation: verificationMethod must be a did');
	let resolutionUrl = 'https://dev.uniresolver.io/1.0/identifiers/';
	if (did.startsWith('did:dyne:')) {
		resolutionUrl = 'https://did.dyne.org/dids/';
	}
	resolutionUrl += did;
	const response = await fetch(resolutionUrl);
	if (!response.ok)
		throw new Error(`Invalid presentation: can not resolve ${did} with ${resolutionUrl}`);
	const didDocument = (await response.json()).didDocument;
	const verificationMethod = didDocument.verificationMethod.find(
		(v: Record<string, unknown>) => v['id'] === did,
	);
	if (!verificationMethod)
		throw new Error(
			`Invalid presentation: verificationMethod matching ${did} not found in the did document`,
		);
	// here we can add multiple key support and encodings
	// for the moment use our base58 public keys
	return {
		pkType: did.split('#')[1],
		pk: verificationMethod['publicKeyBase58'],
	};
};

const rdfValidation = async (vp: LdpVcElementType | LdpVcVerifiableCredentialelementType) => {
	const {
		proof: { proofValue, ...proofWithoutProofValue },
		...vpWithoutProof
	} = vp;
	(proofWithoutProofValue as typeof proofWithoutProofValue & { '@context'?: unknown })[
		'@context'
	] = JSON.parse(JSON.stringify(vpWithoutProof['@context']));
	const serializedWithoutProof = await rdfCanon(vpWithoutProof);
	const serializedProof = await rdfCanon(proofWithoutProofValue);
	const { pkType, pk } = await resolveDid(proofWithoutProofValue.verificationMethod);
	switch (pkType) {
		case 'es256_public_key':
			await zencodeExec(es256kb_ldpvc, {
				data: {
					pk,
					serializedProof,
					serializedWithoutProof,
					proofValue,
				},
				keys: {},
			});
			break;
		default:
			throw new Error(`Invalid credential: holder key type not yet supported ${pkType}`);
	}
};
export const parseLdpVc = async (ldpVc: LdpVcElementType) => {
	// holder key binding
	await rdfValidation(ldpVc);
	// issuer signature
	await rdfValidation(ldpVc.verifiableCredential[0]!);
	// expired
	const now = Date.now();
	const exp = Date.parse(ldpVc.verifiableCredential[0]!.validUntil);
	if (exp < now) throw new Error('Invalid credential: expired');
	return {
		credential_format: 'ldp_vc',
		type: ldpVc.verifiableCredential[0]?.['type'],
		claims: ldpVc.verifiableCredential[0],
		cryptographic_holder_binding: true,
	};
};
