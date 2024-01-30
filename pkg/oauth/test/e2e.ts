import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';

test('create token', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I send body 'body' and send headers 'headers' and send jwk 'jwk' and generate access token and output into 'accessToken_jwt'

Given I have a 'string dictionary' named 'accessToken_jwt'

Then print data
`;
	const slangroom = new Slangroom(oauth);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			jwk: {
				"kty" : "EC",
				"crv" : "P-256",
				"alg" : "ES256",
				"x"   : "SVqB4JcUD6lsfvqMr-OKUNUphdNn64Eay60978ZlL74",
				"y"   : "lf0u0pMj4lGAzZix5u4Cm5CMQIgMNpkwy163wtKYVKI",
				"d"   : "0g5vAEKzugrXaRbgKG0Tj2qJ5lMP4Bezds1_sTybkfk"
			},
			body: "grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb",
			headers: {
				"Authorization": "Basic dGhvbTpuaWdodHdvcmxk",
				"content-length": 42,
				"Content-Type": "application/x-www-form-urlencoded"
			},
		},
	});
	console.log(res.result['accessToken_jwt']);
	t.truthy(res.result['accessToken_jwt']);

});
