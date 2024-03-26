// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';
import { SignJWT, importJWK } from 'jose';
import { randomBytes } from 'crypto';
import { JsonableObject } from '@slangroom/shared';

//For reference see Section 4 of https://datatracker.ietf.org/doc/html/rfc9449.html
async function create_dpop_proof() {
	//this is done client side for token request
	// here for now, just for testing
	var private_jwk = {
		kty: 'EC',
		x: 'iyuaHgjseiWTdKd_EuhxO43oayK05z_wEb2SlsxofSo',
		y: 'EJBrgZE_wqm3P0bPuuYpO-5wbEbk9xy-8hdOiVODjOM',
		d: 'neBDuFx9xMkXWpoU+Tk9KAofgH3qzN0e3jSSjssrM8U=',
		crv: 'P-256',
	};

	var privateKey = await importJWK(private_jwk);

	const dpop = new SignJWT({
		jti: randomBytes(16).toString('base64url'),
		htm: 'POST',
		htu: 'https://server.example.com/token',
	})
		.setProtectedHeader({
			typ: 'dpop+jwt',
			alg: 'ES256',
			jwk: {
				kty: 'EC',
				x: 'iyuaHgjseiWTdKd_EuhxO43oayK05z_wEb2SlsxofSo',
				y: 'EJBrgZE_wqm3P0bPuuYpO-5wbEbk9xy-8hdOiVODjOM',
				crv: 'P-256',
			},
		})
		.setIssuedAt(Math.round(Date.now() / 1000))
		.sign(privateKey);
	return dpop;
}

//for details on code_challenge/code_verifier see https://node-oauthoauth2-server.readthedocs.io/en/master/misc/pkce.html#authorization-request

//NOTE: scope is the string credential_id that specifies the type of credential the client is requesting
//		resource is the URL where we can find the .well-known/openid-credential-issuer

test('create authorization code and access token with PAR', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I send request 'request' and send client 'client' and send server_data 'server' and send expires_in 'expires_in' and generate request uri and output into 'request_uri_out'

Given I have a 'string dictionary' named 'request_uri_out'

Then print data
`;
	const slangroom = new Slangroom(oauth);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			server: {
				jwk: {
					kty: 'EC',
					crv: 'P-256',
					alg: 'ES256',
					x: 'SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74',
					y: 'lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI',
					d: '0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk',
				},
				url: 'https://valid.issuer.url',
				authentication_url: 'https://did.dyne.org/dids/'
			},
			request: {
				//&scope=Auth1&resource=http%3A%2F%2Fissuer1.zenswarm.forkbomb.eu%3A3100%2Fcredential_issuer%2F
				//authorization_details=%5B%7B%22type%22%3A%20%22openid_credential%22%2C%20%22credential_configuration_id%22%3A%20%22Auth1%22%2C%22locations%22%3A%20%5B%22http%3A%2F%2Fissuer1.zenswarm.forkbomb.eu%3A3100%2Fcredential_issuer%2F%22%5D%7D%5D
				body: 'response_type=code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&state=xyz&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb&authorization_details=%5B%7B%22type%22%3A+%22openid_credential%22%2C+%22credential_configuration_id%22%3A+%22Auth1%22%2C%22locations%22%3A+%5B%22http%3A%2F%2Fissuer1.zenswarm.forkbomb.eu%3A3100%2Fcredential_issuer%2F%22%5D%2C%22given_name%22%3A%22Pippo%22%2C+%22family_name%22%3A%22Peppe%22%2C%22is_human%22%3Atrue%7D%5D',
				headers: {
					Authorization: '',
				},
			},
			expires_in: 500,
			client: {
				id: 'did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5',
				clientSecret:
					'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJwaXBwbyJ9.hiVPL2JTdmcZY7Vcso95KUBEzcTGvmvQ7wlwkCo0G74Unpzny2drvLsu-HzHWyckKbRjwWox-V5gqqKeka8kEQ',
				grants: ['authorization_code'],
				redirectUris: ['https://Wallet.example.org/cb'],
				scope: ['Auth1'],
				resource: "http://issuer1.zenswarm.forkbomb.eu/credential_issuer/"
			},
		},
	});
	console.log(res.result['request_uri_out']);
	t.truthy(res.result['request_uri_out']);

	const scriptCreateBodyRequest1 = `
Rule unknown ignore

Given I have a 'string' named 'body'
Given I have a 'string dictionary' named 'request_uri_out'

When I create the copy of 'request_uri' from dictionary 'request_uri_out'
# TODO: check if we need encoding before append
When I append 'copy' to 'body'

Then print the 'body'
`;
	const resb = await slangroom.execute(scriptCreateBodyRequest1, {
		keys: {
			request_uri_out: res.result['request_uri_out'] || {},
			body: 'client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&request_uri=',
		},
	});
	t.truthy(resb.result['body']);

	const scriptAuthCode = `
Rule unknown ignore

Given I send request 'request' and send server_data 'server' and generate authorization code and output into 'authCode'

Given I have a 'string dictionary' named 'authCode'

Then print data
`;
	const res_auth = await slangroom.execute(scriptAuthCode, {
		keys: {
			server: {
				jwk: {
					kty: 'EC',
					crv: 'P-256',
					alg: 'ES256',
					x: 'SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74',
					y: 'lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI',
					d: '0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk',
				},
				url: 'https://valid.issuer.url',
				authentication_url: 'https://did.dyne.org/dids/'
			},
			request: {
				body: resb.result['body'] || '',
				headers: {
					Authorization: '',
				},
			}
		},
	});
	console.log(res_auth.result['authCode']);
	t.truthy(res_auth.result['authCode']);

	const scriptCreateBodyRequest = `
Rule unknown ignore

Given I have a 'string' named 'body'
Given I have a 'string dictionary' named 'auth_code'
When I create the copy of 'code' from dictionary 'auth_code'
When I append 'copy' to 'body'

Then print the 'body'
`;

	const res2 = await slangroom.execute(scriptCreateBodyRequest, {
		keys: {
			auth_code: res_auth.result['authCode']!,
			body: 'grant_type=authorization_code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb&code=',
		},
	});

	t.truthy(res2.result['body']);
	const scriptCreateToken = `
Rule unknown ignore

Given I send request 'request' and send server_data 'server' and generate access token and output into 'accessToken_jwt'

Given I have a 'string dictionary' named 'accessToken_jwt'

Then print data
`;
	const res3 = await slangroom.execute(scriptCreateToken, {
		keys: {
			server: {
				jwk: {
					kty: 'EC',
					crv: 'P-256',
					alg: 'ES256',
					x: 'SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74',
					y: 'lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI',
					d: '0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk',
				},
				url: 'https://valid.issuer.url',
				authentication_url: 'https://did.dyne.org/dids/'
			},
			request: {
				body: res2.result['body'] || '',
				headers: {
					'content-length': 42,
					'Content-Type': 'application/x-www-form-urlencoded',
					DPoP: await create_dpop_proof(),
				},
			},
		},
	});
	console.log(res3.result['accessToken_jwt']);
	t.truthy(res3.result['accessToken_jwt']);
	const scriptGetClaims = `
Rule unknown ignore

Given I send token 'token' and send server_data 'server' and get claims from token and output into 'claims'
Given I have a 'string dictionary' named 'claims'

Then print data
`;
	const token_jwt = res3.result['accessToken_jwt'] as JsonableObject;
	const token_str = token_jwt['accessToken'];
	if (token_str == undefined) throw new Error("token not found");
	const res4 = await slangroom.execute(scriptGetClaims, {
		keys: {
			server: {
				url: 'https://valid.issuer.url'
			},
			token: token_str
		},
	});
	console.log(res4.result['claims']);
	t.truthy(res4.result['claims']);

});

