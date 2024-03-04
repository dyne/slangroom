import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';
import { SignJWT, importJWK } from 'jose';
import { randomBytes } from 'crypto';

// For reference see Section 4 of https://datatracker.ietf.org/doc/html/rfc9449.html
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

// TODO: the request body in the test is missing scope/resource parameter
//		verifyScope has been tested locally (resource = http://localhost:3000/)
//		update body with scope/resource when a deployed CredentialIssuer is available
//		and make scope/resource mandatory parameters for the request
//		scope is the string credential_id that specifies the type of credential the client is requesting
//		resource is the URL where we can find the .well-known/openid-credential-issuer

test('create authorization code and access token with PAR', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I send request 'request' and send client 'client' and send server_data 'server' and generate request uri and output into 'request_uri_out'

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
				authentication_url : 'https://did.dyne.org/dids/'
			},
			request: {
				body: 'response_type=code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&state=xyz&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb',
				headers: {
					Authorization: '',
				},
			},

			client: {
				id: 'did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5',
				clientSecret:
					'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJwaXBwbyJ9.hiVPL2JTdmcZY7Vcso95KUBEzcTGvmvQ7wlwkCo0G74Unpzny2drvLsu-HzHWyckKbRjwWox-V5gqqKeka8kEQ',
				grants: ['authorization_code'],
				redirectUris: ['https://Wallet.example.org/cb'],
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

	Given I send request 'request' and send server_data 'server' and generate authorization code and output into 'authCode_jwt'

	Given I have a 'string dictionary' named 'authCode_jwt'

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
				authentication_url : 'https://did.dyne.org/dids/'
			},
			request: {
				body: resb.result['body'] || '',
				headers: {
					Authorization: '',
				},
			}
		},
	});
	console.log(res_auth.result['authCode_jwt']);
	t.truthy(res_auth.result['authCode_jwt']);

	const scriptCreateBodyRequest = `
	Rule unknown ignore

	Given I have a 'string' named 'body'
	Given I have a 'string dictionary' named 'auth_code_jwt'

	When I create the copy of 'authorizationCode' from dictionary 'auth_code_jwt'
	When I append 'copy' to 'body'

	Then print the 'body'
	`;
	const res2 = await slangroom.execute(scriptCreateBodyRequest, {
		keys: {
			auth_code_jwt: res.result['authCode_jwt'] || {},
			body: 'grant_type=authorization_code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb&code=',
		},
	});

	t.truthy(res2.result['body']);
	const scriptCreateToken = `
	Rule unknown ignore

	Given I send request 'request' and send code 'authCode' and send server_data 'server' and generate access token and output into 'accessToken_jwt'

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
				authentication_url : 'https://did.dyne.org/dids/'
			},
			authCode: res.result['authCode_jwt'] || {},
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
});


// 	//var jws = "eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCJ9.eyJfc2QiOiBbImNNWmlsaE9GOXVFeXZXX3ZDS3g4SWticWZtbnRqcWtWOEhDRlFfbGdQcTAiLCAiRGpVQzNpWERtVWowUVFnYlpNN1BRaGhPTEkzRWpxU056ejNJaENwcVFoZyIsICJ3eW9TZXBTa3BKWG5PeEtsc3lwZXFqcjlQTUZYZjAyNEdsSUJQZ1ZLbnJnIiwgIk1XNTh6cVV5b29KdzV6R21BU0NFVE5pNHFPUmNld3VUUldEaExNTGF2aXMiLCAic2Z0bnU4N2JrYmw2MkFCMzhnbXV5UWRYNXlEOTVUeE11emh2eWlEN1diOCIsICJkeWRiallMOGJjVGtjWHRMWjJlODUxNEI3bjdRRG5PZ09XRDVGbml3amRvIiwgIjg0VnA0eW1nLThWU2NnWWxldEdCNFRmSGJvTFBrSVhMYVAzZGpMMkttMFUiXSwgIl9zZF9hbGciOiAic2hhLTI1NiIsICJpc3MiOiAiaHR0cDovL2V4YW1wbGUub3JnIiwgInN1YiI6ICJ1c2VyIDQyIn0.zfJnEY9fHtkPtOL0b97DCa7zjV5h13Yazxolw9sfZrcFax8G7xSG4-Ai8uCNZgm-KpfpBANXo5NB2x2oWjqiWA"
// //var jws = "eyJhbGciOiAiRVMyNTYiLCAidHlwIjogInZjK3NkLWp3dCJ9.eyJfc2QiOiBbIjBuOXl6RlNXdktfQlVIaWFNaG0xMmdockN0VmFockdKNl8ta1pQLXlTcTQiLCAiQ2gtREJjTDNrYjRWYkhJd3Rrbm5aZE5VSHRoRXE5TVpqb0ZkZzZpZGlobyIsICJEVzdnRlZaU3V5cjQyWVNZeDhwOHJWS0VrdEp6SjN1RkltZW5tSkJJbWRzIiwgIkkwMGZjRlVvRFhDdWNwNXl5MnVqcVBzc0RWR2FXTmlVbGlOel9hd0QwZ2MiLCAiWDlNYVBhRldtUVlwZkhFZHl0UmRhY2xuWW9FcnU4RXp0QkVVUXVXT2U0NCIsICJkOHFrZlBkb2UyUFlFOTNkNU1fZ0JMMWdabHBGUktDYzBkMWxhb2RfX3MwIiwgImxJM0wwaHNlQ1JXbVVQZzgyVkNVTl9hMTdzTUxfNjRRZ0E0SkZUWURGREUiLCAicHVNcEdMb0FHUmJjc0FnNTBVWjBoaFFMS0NMNnF6eFNLNDMwNGtCbjNfSSIsICJ6VTQ1MmxrR2JFS2g4WnVIXzhLeDNDVXZuMUY0eTFnWkxxbERUZ1hfOFBrIl0sICJpc3MiOiAiaHR0cHM6Ly9waWQtcHJvdmlkZXIubWVtYmVyc3RhdGUuZXhhbXBsZS5ldSIsICJpYXQiOiAxNTQxNDkzNzI0LCAiZXhwIjogMTg4MzAwMDAwMCwgInZjdCI6ICJQZXJzb25JZGVudGlmaWNhdGlvbkRhdGEiLCAiX3NkX2FsZyI6ICJzaGEtMjU2IiwgImNuZiI6IHsiandrIjogeyJrdHkiOiAiRUMiLCAiY3J2IjogIlAtMjU2IiwgIngiOiAiVENBRVIxOVp2dTNPSEY0ajRXNHZmU1ZvSElQMUlMaWxEbHM3dkNlR2VtYyIsICJ5IjogIlp4amlXV2JaTVFHSFZXS1ZRNGhiU0lpcnNWZnVlY0NFNnQ0alQ5RjJIWlEifX19.VStKGOA5TdLsrjahM4dRfDrbsy7BmrUNGw3jaBuxZnHYvmS2EnQ-ib7zSCUVBGGbcyORDFCMd_F6gr8CM9N3WQ"
// var jws = "eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCJ9.eyJfc2QiOiBbIjBuOXl6RlNXdktfQlVIaWFNaG0xMmdockN0VmFockdKNl8ta1pQLXlTcTQiLCAiQ2gtREJjTDNrYjRWYkhJd3Rrbm5aZE5VSHRoRXE5TVpqb0ZkZzZpZGlobyIsICJEVzdnRlZaU3V5cjQyWVNZeDhwOHJWS0VrdEp6SjN1RkltZW5tSkJJbWRzIiwgIkkwMGZjRlVvRFhDdWNwNXl5MnVqcVBzc0RWR2FXTmlVbGlOel9hd0QwZ2MiLCAiWDlNYVBhRldtUVlwZkhFZHl0UmRhY2xuWW9FcnU4RXp0QkVVUXVXT2U0NCIsICJkOHFrZlBkb2UyUFlFOTNkNU1fZ0JMMWdabHBGUktDYzBkMWxhb2RfX3MwIiwgImxJM0wwaHNlQ1JXbVVQZzgyVkNVTl9hMTdzTUxfNjRRZ0E0SkZUWURGREUiLCAicHVNcEdMb0FHUmJjc0FnNTBVWjBoaFFMS0NMNnF6eFNLNDMwNGtCbjNfSSIsICJ6VTQ1MmxrR2JFS2g4WnVIXzhLeDNDVXZuMUY0eTFnWkxxbERUZ1hfOFBrIl0sICJfc2RfYWxnIjogInNoYS0yNTYiLCAiY25mIjogeyJqd2siOiB7ImNydiI6ICJQLTI1NiIsICJrdHkiOiAiRUMiLCAieCI6ICJUQ0FFUjE5WnZ1M09IRjRqNFc0dmZTVm9ISVAxSUxpbERsczd2Q2VHZW1jIiwgInkiOiAiWnhqaVdXYlpNUUdIVldLVlE0aGJTSWlyc1ZmdWVjQ0U2dDRqVDlGMkhaUSJ9fSwgImV4cCI6IDE4ODMwMDAwMDAsICJpYXQiOiAxNTQxNDkzNzI0LCAiaXNzIjogImh0dHBzOi8vcGlkLXByb3ZpZGVyLm1lbWJlcnN0YXRlLmV4YW1wbGUuZXUiLCAidmN0IjogIlBlcnNvbklkZW50aWZpY2F0aW9uRGF0YSJ9.gyvKONZZiFmTUbQseoJ6KdAYJPyFixv0rMXL2T39sayRN1uPbAyyBDjNOEPf2YZynadqZkStE2z-p7F17dXz2Q~WyIyR0xDNDJzS1F2ZUNmR2ZyeU5STjl3IiwgImZpcnN0X25hbWUiLCAiRXJpa2EiXQ"
// var k_b64 = "gyvKONZZiFmTUbQseoJ6KdAYJPyFixv0rMXL2T39sawziR3I49jMp/6ChAupQYqZhYPVC/RtxBI+tUcULh1SCg=="
// var buf = Buffer.from(k_b64,'base64')
// var x = (buf.slice(0,32)).toString('base64url')
// var y = (buf.slice(32)).toString('base64url')
// var	publicKey = await importJWK(
// 		{ crv: 'P-256',
// 			kty: 'EC',
// 			x: x,
// 			y: y
// 		},
// 		'ES256');

// const verify_sig = await jwtVerify(jws, publicKey);
// console.log(verify_sig)
