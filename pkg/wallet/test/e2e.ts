import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { wallet } from '@slangroom/wallet';

test('Create VC SD JWT', async (t) => {
	t;
	const script = `
Rule caller restroom-mw
Scenario 'eddsa': Create the public key

Given I have the 'keyring'
Given I have a 'string' named 'crv'
Given I have a 'string' named 'kty'

When I create the eddsa public key
When I pickup from path 'keyring.eddsa'
When I rename 'eddsa' to 'd'
When I rename 'eddsa public key' to 'x'

Then print the 'x' as 'url64' in 'jwk'
Then print the 'd' as 'url64' in 'jwk'
Then print the 'crv' as 'string' in 'jwk'
Then print the 'kty' as 'string' in 'jwk'

Then I send jwk 'jwk' and send holder 'holder' and send object 'object' and send fields 'fields' and create vc sd jwt and output into 'vcsdjwt'
`;
	const slangroom = new Slangroom(wallet);
	const res = await slangroom.execute(script, {
		keys: {
			keyring: {
				eddsa: "6c7zvt8NvhLEXFACvkJW5DVqZzutuFDkxCxCZ8mzGzSP"
			},
			crv: "Ed25519",
			kty: "OKP",
			holder: "DXXa2upAr7hgseAtFfz2NuSfmFrmx6iySvmG9PHHRq6D",
			object: {
				name: 'test person',
				age: 25,
			},
			fields: ['name', 'age']
		}
	});
	t.truthy(res.result['vcsdjwt']);
});
