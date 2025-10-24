// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export type JWK = {
	kty: string;
	use?: string;
	key_ops?: string[];
	alg?: string;
	kid?: string;
	// For EC keys
	crv?: string;
	x?: string;
	y?: string;
	// For RSA keys
	n?: string;
	e?: string;
	// Optional extra fields
	[prop: string]: any;
}

export type ExtractKeyOutput = {
	result: {
		iss: string;
		jwk: JWK;
	},
	logs: string;
}
export const extractKey = `
Scenario 'sd_jwt': dc+sd-jwt_kb

Given I have a 'signed selective disclosure with key binding' named 'credential'

When I pickup a 'string' from path 'credential.jwt.payload.iss'
When I append the string '/.well-known/openid-credential-issuer' to 'iss'

When I pickup a 'string' from path 'credential.jwt.payload.cnf.jwk'

Then print the 'iss'
Then print the 'jwk'
`

export const es256kb = `
Scenario 'w3c': jwt and jws

Given I have a 'string' named 'kb'
Given I rename 'kb' to 'kb_string'
Given I have a 'jwt' named 'kb'
Given I have a 'string' named 'credential'
Given I have a 'url64' named 'x'
Given I have a 'url64' named 'y'
# typ
When I pickup from path 'kb.header.typ'
When I set 'kb+jwt' to 'kb+jwt' as 'string'
When I verify 'typ' is equal to 'kb+jwt'
# hash
When I pickup from path 'kb.payload.sd_hash'
When I create the hash of 'credential'
When I move 'hash' as 'url64' to 'url64_hash'
When I verify 'url64_hash' is equal to 'sd_hash'
# signature
When I append 'y' to 'x'
When I rename 'x' to 'es256 public key'
When I verify jws signature in 'kb_string'

When I set 'result' to 'OK' as 'string'
Then print the 'result'
`

export type Es256dcsdjwtOutput = {
	result: {
		disclosures: [string, string, string | number | boolean][];
		payload: Record<string, unknown>;
	},
	logs: string;
}
export const es256dcsdjwt = `
Scenario 'w3c': dcsdjwt
Scenario 'sd_jwt': cred

Given I have a 'url64' in path 'jwk.x'
Given I have a 'url64' in path 'jwk.y'
Given I have a 'signed selective disclosure' named 'credential'

When I append 'y' to 'x'
When I rename 'x' to 'es256 public key'
When I verify the signed selective disclosure 'credential' issued by 'es256 public key' is valid

When I pickup a 'string' from path 'credential.disclosures'
When I pickup a 'string' from path 'credential.jwt.payload'

Then print the 'disclosures'
Then print the 'payload'
`
