import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';

//for details on code_challenge/code_verifier see https://node-oauthoauth2-server.readthedocs.io/en/master/misc/pkce.html#authorization-request

test('create authorization code and access token', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I send body 'body' and send headers 'headers' and send client 'client' and send jwk 'jwk' and generate authorization code and output into 'authCode_jwt'

Given I have a 'string dictionary' named 'authCode_jwt'

Then print data
`;
	const slangroom = new Slangroom(oauth);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			jwk: {
				"kty": "EC",
				"crv": "P-256",
				"alg": "ES256",
				"x": "SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74",
				"y": "lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI",
				"d": "0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk"
			},
			body: "response_type=code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&state=xyz&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&scope=xyz&authorization_details=%5B%7B%22type%22%3A%20%22openid_credential%22%2C%20%22credential_configuration_id%22%3A%20%22UniversityDegreeCredential%22%7D%5D&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb",
			headers: {
				"Authorization": ""
			},
			client: {
				"id": 'did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5',
				"clientSecret": 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJwaXBwbyJ9.hiVPL2JTdmcZY7Vcso95KUBEzcTGvmvQ7wlwkCo0G74Unpzny2drvLsu-HzHWyckKbRjwWox-V5gqqKeka8kEQ',
				"grants": ["authorization_code"],
				"redirectUris": ['https://Wallet.example.org/cb']
			}
		},
	});
	console.log(res.result['authCode_jwt']);
	t.truthy(res.result['authCode_jwt']);

	const scriptCreateBodyRequest = `
	Rule unknown ignore
	Given I send body1 'body1' and send body2 'body2' and send authcode_jwt 'authCode' and create request string and output into 'body'
	Given I have a 'string' named 'body'
	Then print data
	`;
	const res2 = await slangroom.execute(scriptCreateBodyRequest, {
		keys: {
			authCode: res.result['authCode_jwt'] || {},
			body1: "grant_type=authorization_code&client_id=did:dyne:sandbox.genericissuer:6Cp8mPUvJmQaMxQPSnNyhb74f9Ga4WqfXCkBneFgikm5&code=",
			body2: "&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb&authorization_details=%5B%7B%22type%22%3A%20%22openid_credential%22%2C%20%22credential_configuration_id%22%3A%20%22UniversityDegreeCredential%22%7D%5D",
		}
	});

	t.truthy(res2.result['body']);
	const scriptCreateToken = `
	Rule unknown ignore

	Given I send body 'body' and send headers 'headers' and send code 'authCode' and send jwk 'jwk' and generate access token and output into 'accessToken_jwt'

	Given I have a 'string dictionary' named 'accessToken_jwt'

	Then print data
	`;
	const res3 = await slangroom.execute(scriptCreateToken, {
		keys: {
			jwk: {
				"kty": "EC",
				"crv": "P-256",
				"alg": "ES256",
				"x": "SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74",
				"y": "lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI",
				"d": "0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk"
			},
			authCode: res.result['authCode_jwt'] || {},
			body: res2.result['body'] || '',
			headers: {
				"Authorization": "",
				"content-length": 42,
				"Content-Type": "application/x-www-form-urlencoded"
			},

		},
	});
	console.log(res3.result['accessToken_jwt']);
	t.truthy(res3.result['accessToken_jwt']);
});

//ZGlkOmR5bmU6c2FuZGJveC5nZW5lcmljaXNzdWVyOjZDcDhtUFV2Sm1RYU14UVBTbk55aGI3NGY5R2E0V3FmWENrQm5lRmdpa201OmV5SmhiR2NpT2lKRlV6STFOaUo5LmV5SnpkV0lpT2lKd2FYQndieUo5LmhpVlBMMkpUZG1jWlk3VmNzbzk1S1VCRXpjVEd2bXZRN3dsd2tDbzBHNzRVbnB6bnkyZHJ2THN1LUh6SFd5Y2tLYlJqd1dveC1WNWdxcUtla2E4a0VR
