// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';
import { SignJWT, importJWK } from 'jose';
import { randomBytes } from 'crypto';
import { JsonableObject } from '@slangroom/shared';

// some types utility
type resParType = {
	result: {
		request_uri_out: {
			request_uri: string;
			expires_in: number;
		};
	};
};
type resAuthType = {
	result: {
		authCode: { code: string };
		auth_details: Array<{
			claims: JsonableObject;
			credential_configuration_id: string;
			locations: Array<string>;
			type: string;
		}>;
	};
};
type resTokenType = {
	result: {
		accessToken_jwt: {
			accessToken: string;
			accessTokenExpiresAt: number;
			authorizationCode: string;
			c_nonce: string;
			c_nonce_expires_in: number;
			jkt: string;
			refreshToken: string;
			refreshTokenExpiresAt: number;
			scope: Array<string>;
			resource: string;
			authorization_details: Array<JsonableObject>;
		};
	};
};

// global variables
let resPar: resParType;
let resAuth: resAuthType;
let resToken: resTokenType;
const slangroom = new Slangroom(oauth);
const server = {
	jwk: {
		kty: 'EC',
		crv: 'P-256',
		alg: 'ES256',
		x: 'SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74',
		y: 'lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI',
		d: '0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk',
	},
	url: 'https://valid.issuer.url',
	authentication_url: 'https://did.dyne.org/dids/',
};

//For reference see Section 4 of https://datatracker.ietf.org/doc/html/rfc9449.html
async function create_dpop_proof() {
	//this is done client side for token request
	// here for now, just for testing
	const private_jwk = {
		kty: 'EC',
		x: 'iyuaHgjseiWTdKd_EuhxO43oayK05z_wEb2SlsxofSo',
		y: 'EJBrgZE_wqm3P0bPuuYpO-5wbEbk9xy-8hdOiVODjOM',
		d: 'neBDuFx9xMkXWpoU+Tk9KAofgH3qzN0e3jSSjssrM8U=',
		crv: 'P-256',
	};

	const privateKey = await importJWK(private_jwk);

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
test.serial('create request_uri (simulate par endpoint)', async (t) => {
	const scriptCreate = `
Rule unknown ignore
Given I send request 'request' and send client 'client' and send server_data 'server' and send expires_in 'expires_in' and generate request uri and output into 'request_uri_out'
Given I have a 'string dictionary' named 'request_uri_out'
Then print data
`;
	resPar = (await slangroom.execute(scriptCreate, {
		keys: {
			server,
			request: {
				//&scope=Auth1&resource=http%3A%2F%2Fissuer1.zenswarm.forkbomb.eu%3A3100%2Fcredential_issuer%2F
				body: 'response_type=code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&state=xyz&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb&authorization_details=%5B%7B%22type%22%3A+%22openid_credential%22%2C+%22credential_configuration_id%22%3A+%22test_credential%22%2C%22locations%22%3A+%5B%22http%3A%2F%2Flocalhost%3A3001%2Fcredential_issuer%2F%22%5D%7D%5D',
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
				scope: ['test_credential'],
				resource: 'http://localhost:3001/credential_issuer/',
			},
		},
	})) as unknown as resParType;

	t.true(
		resPar.result['request_uri_out']['request_uri'].startsWith(
			'urn:ietf:params:oauth:request_uri:',
		),
	);
	t.is(resPar.result['request_uri_out']['expires_in'], 500);
});

test.serial('get redirect_uri from request_uri (utility for authorize endpoint)', async (t) => {
	const scriptGetRedirectUri = `
Rule unknown ignore
Given I send request_uri 'request_uri' and send server_data 'server' and get redirect_uri from request_uri and output into 'redirect_uri_res'
Given I have a 'string' named 'redirect_uri_res'
Then print data
`;
	const resRedirectUri = (await slangroom.execute(scriptGetRedirectUri, {
		keys: {
			server: {
				url: 'https://valid.issuer.url',
			},
			request_uri: resPar.result.request_uri_out.request_uri,
		},
	})) as unknown as {
		result: {
			redirect_uri_res: string;
		};
	};
	t.is(resRedirectUri.result.redirect_uri_res, 'https://Wallet.example.org/cb');
});

test.serial('create authorization code (simulate authorize endpoint)', async (t) => {
	const scriptAuthCode = `
Rule unknown ignore
Scenario 'http': params

Given I have a 'string' named 'client_id'
Given I have a 'string' named 'request_uri' in 'request_uri_out'

Given I have a 'string dictionary' named 'request'

When I create the 'string dictionary' named 'request_body'
and I copy the 'client_id' in 'request_body'
and I copy the 'request_uri' in 'request_body'
and I create the http get parameters from 'request_body' using percent encoding

When I move 'http get parameters' to 'body' in 'request'

Then print the 'request'
and print the 'request_uri'

Then I send request 'request' and send server_data 'server' and verify request parameters
Then I send request_uri 'request_uri' and send data 'data' and send server_data 'server' and add data to authorization details and output into 'auth_details'
Then I send request 'request' and send server_data 'server' and generate authorization code and output into 'authCode'
`;
	resAuth = (await slangroom.execute(scriptAuthCode, {
		keys: {
			server,
			request: {
				headers: {
					Authorization: '',
				},
			},
			client_id:
				'did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5',
			request_uri_out: resPar.result['request_uri_out'],
			data: {
				email_address: 'pippo@pippo.com',
			},
		},
	})) as unknown as resAuthType;
	t.truthy(resAuth.result.authCode.code);
	t.true(
		resAuth.result.authCode.code.startsWith(
			'eyJhbGciOiJFUzI1NiIsImp3ayI6eyJrdHkiOiJFQyIsIngiOiJTVnFCNEpjVUQ2bHNmdnFNci1PS1VOVXBoZE5uNjRFYXk2MDk3OFpsTDc0IiwieSI6ImxmMHUwcE1qNGxHQXpaaXg1dTRDbTVDTVFJZ01OcGt3eTE2M3d0S1lWS0kiLCJjcnYiOiJQLTI1NiJ9fQ',
		),
	);
	t.is(resAuth.result.auth_details[0]?.claims['email_address'], 'pippo@pippo.com');
	t.is(resAuth.result.auth_details[0]?.type, 'openid_credential');
	t.is(resAuth.result.auth_details[0]?.credential_configuration_id, 'test_credential');
	t.is(
		resAuth.result.auth_details[0]?.locations[0],
		'http://localhost:3001/credential_issuer/',
	);
});

test.serial('create access token (simulate token endpoint)', async (t) => {
	const scriptCreateToken = `
Rule unknown ignore
Scenario 'http': params

Given I have a 'string' named 'grant_type'
Given I have a 'string' named 'client_id'
Given I have a 'string' named 'code_verifier'
Given I have a 'string' named 'redirect_uri'
Given I have a 'string' named 'code'
Given I have a 'string dictionary' named 'request'

When I create the 'string dictionary' named 'request_body'
and I move 'grant_type' in 'request_body'
and I move 'client_id' in 'request_body'
and I move 'code_verifier' in 'request_body'
and I move 'redirect_uri' in 'request_body'
and I move 'code' in 'request_body'
and  I create the http get parameters from 'request_body' using percent encoding

When I move 'http get parameters' to 'body' in 'request'

Then print the 'request'

Then I send request 'request' and send server_data 'server' and generate access token and output into 'accessToken_jwt'
`;
	resToken = (await slangroom.execute(scriptCreateToken, {
		keys: {
			server,
			grant_type: 'authorization_code',
			client_id:
				'did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5',
			code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
			redirect_uri: 'https://Wallet.example.org/cb',
			code: resAuth.result.authCode.code,
			request: {
				headers: {
					'content-length': 42,
					'Content-Type': 'application/x-www-form-urlencoded',
					DPoP: await create_dpop_proof(),
				},
			},
		},
	})) as unknown as resTokenType;
	t.is(typeof resToken.result.accessToken_jwt.accessToken, 'string');
	t.is(typeof resToken.result.accessToken_jwt.accessTokenExpiresAt, 'number');
	t.is(resToken.result.accessToken_jwt.authorizationCode, resAuth.result.authCode.code);
	t.is(typeof resToken.result.accessToken_jwt.c_nonce, 'string');
	t.is(resToken.result.accessToken_jwt.c_nonce_expires_in, 3600);
	t.is(typeof resToken.result.accessToken_jwt.jkt, 'string');
	t.is(typeof resToken.result.accessToken_jwt.refreshToken, 'string');
	t.is(typeof resToken.result.accessToken_jwt.refreshTokenExpiresAt, 'number');
	t.true(Array.isArray(resToken.result.accessToken_jwt.scope));
	t.is(
		resToken.result.accessToken_jwt.resource,
		'http://localhost:3001/credential_issuer/',
	);
	t.true(Array.isArray(resToken.result.accessToken_jwt.authorization_details));
});

test.serial('get claims (simulate introspection endpoint)', async (t) => {
	const scriptGetClaims = `
Rule unknown ignore
Given I send token 'token' and send server_data 'server' and get authorization details from token and output into 'claims'
Given I have a 'string array' named 'claims'
Then print data
`;
	const token_str = resToken.result['accessToken_jwt']['accessToken'];
	if (token_str == undefined) throw new Error('token not found');
	const resClaims = (await slangroom.execute(scriptGetClaims, {
		keys: {
			server: {
				url: 'https://valid.issuer.url',
			},
			token: token_str,
		},
	})) as unknown as {
		result: {
			claims: Array<{
				claims: JsonableObject;
				credential_configuration_id: string;
				locations: Array<string>;
				type: string;
			}>;
		};
	};
	t.is(resClaims.result.claims[0]?.claims['email_address'], 'pippo@pippo.com');
	t.is(resClaims.result.claims[0]?.type, 'openid_credential');
	t.is(resClaims.result.claims[0]?.credential_configuration_id, 'test_credential');
	t.is(
		resClaims.result.claims[0]?.locations[0],
		'http://localhost:3001/credential_issuer/',
	);
});
