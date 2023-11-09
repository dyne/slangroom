import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { wallet } from '@slangroom/wallet';

test('Create VC SD JWT', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I create p-256 key and output into 'issuer_jwk'
Given I create p-256 key and output into 'holder_jwk'
Given I send sk 'holder_jwk' and create p-256 public key and output into 'holder_public_jwk'
Given I send sk 'issuer_jwk' and create p-256 public key and output into 'issuer_public_jwk'
Given I send jwk 'holder_jwk' and send holder 'holder_public_jwk' and send object 'object' and send fields 'fields' and create vc sd jwt and output into 'vcsdjwt'
Given I have a 'string dictionary' named 'issuer_jwk'
Given I have a 'string dictionary' named 'holder_jwk'
Given I have a 'string dictionary' named 'holder_public_jwk'
Given I have a 'string dictionary' named 'issuer_public_jwk'
Given I have a 'string' named 'vcsdjwt'
Then print data
`;
	const nonce = 'nIdBbNgRqCXBl8YOkfVdg=='
	const slangroom = new Slangroom(wallet);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			object: {
				name: 'test person',
				age: 25,
			},
			fields: ['name', 'age']
		}
	});
	t.truthy(res.result['vcsdjwt']);

	const scriptPrepare = `
Rule unknown ignore

Given I send verifier url 'verifier_url' and send issued vc 'issued_vc' and send disclosed 'disclosed' and send nonce 'nonce' and send holder 'holder_jwk' and present vc sd jwt and output into 'presentation'
Given I have a 'string' named 'presentation'
Then print data
`;
	const res2 = await slangroom.execute(scriptPrepare, {
		keys: {
			disclosed: ["name"],
			nonce,
			verifier_url: 'https://valid.verifier.url',
			holder_jwk: res.result['holder_jwk'] || {},
			issued_vc: res.result['vcsdjwt'] || "",
		}
	});
	t.truthy(res2.result['presentation']);
	console.log(res2.result['presentation']);

	const scriptVerify = `
Rule unknown ignore

Given I send verifier url 'verifier_url' and send issued vc 'presentation' and send nonce 'nonce' and send issuer 'issuer_jwk' and verify vc sd jwt and output into 'presentation'
Given I have a 'string' named 'presentation'
Then print data
`;
	const res3 = await slangroom.execute(scriptVerify, {
		keys: {
			nonce,
			verifier_url: 'https://valid.verifier.url',
			issuer_jwk: res.result['issuer_public_jwk'] || {},
			presentation: res2.result['presentation'] || "",
		}
	});
	console.log(res3);
});
