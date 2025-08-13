// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { did } from '@slangroom/did';

const didDyneAdmin = {
	"@context": "https://w3id.org/did-resolution/v1",
	didDocument: {
		"@context": [
			"https://www.w3.org/ns/did/v1",
			"https://w3id.org/security/suites/ed25519-2018/v1",
			"https://w3id.org/security/suites/secp256k1-2019/v1",
			"https://w3id.org/security/suites/secp256k1-2020/v1",
			"https://dyne.github.io/W3C-DID/specs/ReflowBLS12381.json",
			{
				description: "https://schema.org/description"
			}
		],
		description: "did dyne admin",
		id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
		proof: {
			created: "1671805540866",
			jws: "eyJhbGciOiJFUzI1NksiLCJiNjQiOnRydWUsImNyaXQiOiJiNjQifQ..c-ZsQNm-thjXJZlUofx67h9IKoLUUBV4piL6_HBPShBoQeYcQbnZmuIYepYYkOdI8VoO9YGJScB0YLhExABO5g",
			proofPurpose: "assertionMethod",
			type: "EcdsaSecp256k1Signature2019",
			verificationMethod: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#ecdh_public_key"
		},
		verificationMethod: [
			{
				controller: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#ecdh_public_key",
				publicKeyBase58: "RgeFFa3E245tR9fRTzUWDzn7VCX4NZQXuko69JaxPrN3wG59VYkjijzduHi3CBVXGejp5MgBUWPCYgaFmA4YUBGd",
				type: "EcdsaSecp256k1VerificationKey2019"
			},
			{
				controller: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#reflow_public_key",
				publicKeyBase58: "6haJ6HKw2WKuS6TzbxGyJFvDWwui3fWWchpXjuNhTRiivPGF3FQP4FF1bJBHd3cSsA7cnymmBgwRwLzdkVvTePLXbcje97ZSu1GrvvVYcfEfq5XQHbZFN9ThxUp4VApPMAY8DzufVcLJaMAqP29itvz5gSzXw4WvsJoBgtujBz5b4LT3CgX425CpmyLEwNDgNnhR3vXMxSDT2QxuwtKDAFUHUDCkULDcmFxkox5S2JTWmjEyMpmw97SrXKTcwRQdu9vr2M",
				type: "ReflowBLS12381VerificationKey"
			},
			{
				controller: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#bitcoin_public_key",
				publicKeyBase58: "yWG2QEZqPeAPez39qZf6vpCkmse8oz4UmhD4nWkyCT13",
				type: "EcdsaSecp256k1VerificationKey2019"
			},
			{
				controller: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#eddsa_public_key",
				publicKeyBase58: "DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				type: "Ed25519VerificationKey2018"
			},
			{
				blockchainAccountId: "eip155:1:0x9a31eb5778e6105a252eee9214767828a72d5672",
				controller: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ",
				id: "did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ#ethereum_address",
				type: "EcdsaSecp256k1RecoveryMethod2020"
			}
		]
	},
	didDocumentMetadata: {
		created: "1671805540866",
		deactivated: "false"
	}
}


test('Resolve did', async (t) => {
	const slangroom = new Slangroom(did);
	const contract = `Prepare 'did_document': resolve the did where did is 'did'
Given I have a 'string dictionary' named 'did_document'
Then print the data
`
	const resolveDid = slangroom.execute(contract, {
		data: {
			did: 'did:dyne:admin:DMMYfDo7VpvKRHoJmiXvEpXrfbW3sCfhUBE4tBeXmNrJ',
		},
	});
	const res = await resolveDid;
	const didDocument = res.result['did_document'] as Record<string, string>;
	t.deepEqual(didDocument['didDocument'], didDyneAdmin.didDocument, JSON.stringify(res, null, 2));
	t.deepEqual(didDocument['didDocumentMetadata'], didDyneAdmin.didDocumentMetadata, JSON.stringify(res, null, 2));
	t.truthy(didDocument['didResolutionMetadata'], JSON.stringify(res, null, 2));
});
