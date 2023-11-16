import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { ethereum } from '@slangroom/ethereum';

test('Retrieve a zenroom object', async (t) => {
	const contract = `
Rule caller restroom-mw
Scenario ethereum
Given I connect to 'fabchain' and send transaction_id 'my_tag' and read the ethereum bytes and output into 'poem_bytes'
Given I have a 'hex' named 'poem bytes'
When I create the string from the ethereum bytes named 'poem bytes'
When I rename the 'string' to 'poem'

Then print data
`;
	const sl = new Slangroom(ethereum);
	const res = await sl.execute(contract, {
		data: {
			fabchain: 'http://78.47.38.223:9485',
			my_tag: '0467636a2557a1ccdaf10ce17ee74340096c510acfa9181c85756d43a8bed522',
		},
	});
	t.deepEqual(
		res.result,
		{
			poem: 'Nel mezzo del cammin di nostra vita\nmi ritrovai per una selva oscura,\nché la diritta via era smarrita.',
			poem_bytes:
				'000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000674e656c206d657a7a6f2064656c2063616d6d696e206469206e6f7374726120766974610a6d6920726974726f7661692070657220756e612073656c7661206f73637572612c0a6368c3a9206c612064697269747461207669612065726120736d6172726974612e00000000000000000000000000000000000000000000000000',
		},
		res.logs,
	);
});

test('Store an object on eth', async (t) => {
	const contract = `
Rule caller restroom-mw
Scenario ethereum
Given I connect to 'fabchain' and send address 'my_address' and read the ethereum nonce and output into 'ethereum_nonce'
Given I have the 'keyring'
Given I have a 'ethereum address' named 'storage contract'
Given I have a 'ethereum nonce'
Given I have a 'string' named 'data'
and a 'gas price'
and a 'gas limit'
Given I have a 'string' named 'fabchain'
# Given I read the ethereum suggested gas price
When I create the ethereum transaction to 'storage contract'
and I use the ethereum transaction to store 'data'

When I create the signed ethereum transaction for chain 'fabt'
Then print the 'signed ethereum transaction'
Then print data
Then I connect to 'fabchain' and send transaction 'signed_ethereum_transaction' and read the ethereum transaction id after broadcast and output into 'transaction_id'
`;
	const sl = new Slangroom(ethereum);
	const res = await sl.execute(contract, {
		data: {
			keyring: {
				ethereum: '52268bd5befb5e375f231c16a0614ff97ce81b105190c293a482efe9745c95ae',
			},
			my_address: '0x7d6df85bDBCe99151c813fd1DDE6BC007c523C27',
			fabchain: 'http://78.47.38.223:9485',
			'gas limit': '100000',
			'gas price': '1000000000',
			'gwei value': '0',
			storage_contract: '0x662c4017C01bA23c94257289Dab8C2757b472B81',
			data: 'Nel mezzo del cammin di nostra vita\nmi ritrovai per una selva oscura,\nché la diritta via era smarrita.',
		},
	});

	t.truthy(typeof res.result['transaction_id'] === 'string', res.logs);
});

test('Make slangroom fail', async (t) => {
	const contract = `
Rule caller restroom-mw
Scenario ethereum
Given I connect to 'fabchain' and send address 'my_address' and read the ethereum  and output into 'ethereum_nonce'
Given nothing
Then print data
`;
	const sl = new Slangroom(ethereum);
	await t.throwsAsync(
		async () =>
			await sl.execute(contract, {
				data: {
					my_address: '0x7d6df85bDBCe99151c813fd1DDE6BC007c523C27',
					fabchain: 'http://78.47.38.223:9485',
				},
			}),
	);
});
