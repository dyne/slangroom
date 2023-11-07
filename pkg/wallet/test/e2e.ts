import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { wallet } from '@slangroom/wallet';

test('Create VC SD JWT', async (t) => {
	t;
	const script = `
Given I send holder 'holder' and send object 'object' and send fields 'fields' and create vc sd jwt and output into 'vcsdjwt'
Given I have a 'string' named 'vcsdjwt'
When done
Then print data
`;
	const slangroom = new Slangroom(wallet);
	const res = await slangroom.execute(script, {
		keys: {
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
