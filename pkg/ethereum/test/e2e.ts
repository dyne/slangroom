// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { ethereum } from '@slangroom/ethereum';
import Web3 from 'web3';

let transactionId: string;
let storageContractAddress: string;

// Solidity contract compiled with solc@0.7.x in ABI and bytecode (IMPORTANT: v^0.8.0 will not work!)
/***
 * // SPDX-License-Identifier: AGPL-3.0-or-later
 * pragma solidity >=0.7.0;
 *
 * contract StorageData {
 *  uint256 maxlen = 1000;
 *  event HashSaved(bytes);
 *  constructor(uint256 _maxlen) {
 *    maxlen = _maxlen;
 *  }
 *  function store(bytes memory message) public {
 *    require(message.length <= maxlen, "Message too long");
 *    emit HashSaved(message);
 *  }
 * }
 */
const abi = [{"inputs":[{"internalType":"uint256","name":"_maxlen","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"","type":"bytes"}],"name":"HashSaved","type":"event"},{"inputs":[{"internalType":"bytes","name":"message","type":"bytes"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const;
const bytecode = "0x60806040526000600060005090905534801561001b5760006000fd5b506040516102c43803806102c48339818101604052602081101561003f5760006000fd5b81019080805190602001909291905050505b8060006000508190909055505b50610064565b610251806100736000396000f3fe60806040523480156100115760006000fd5b50600436106100305760003560e01c8063b374012b1461003657610030565b60006000fd5b6100f76004803603602081101561004d5760006000fd5b810190808035906020019064010000000081111561006b5760006000fd5b82018360208201111561007e5760006000fd5b803590602001918460018302840111640100000000831117156100a15760006000fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509090919290909192905050506100f9565b005b60006000505481511115151561017a576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260108152602001807f4d65737361676520746f6f206c6f6e670000000000000000000000000000000081526020015060200191505060405180910390fd5b7fe8faa8dc753bb1ac9a0f35dfd18d60ee54fe3649f031b78949db3627c41faf8e816040518080602001828103825283818151815260200191508051906020019080838360005b838110156101dd5780820151818401525b6020810190506101c1565b50505050905090810190601f16801561020a5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15b5056fea26469706673582212201c04ecad779a281df0f100b7e3cb0596eff7aa187ba1f63080e15e955d3c7c3664736f6c63430007060033";

test.before(async () => {
	// Deploy the smart contract
	const web3 = new Web3('http://localhost:9485');
	const contract = new web3.eth.Contract(abi);
	const instance = await contract.deploy({
		data: bytecode,
		arguments: [1000],
	}).send({
		from: '0x7d6df85bDBCe99151c813fd1DDE6BC007c523C27',
		gas: '3000000'
	});
	storageContractAddress = instance.options.address!;
})

test.serial('Store an object on eth', async (t) => {
	const contract = `
Rule unknown ignore
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
			fabchain: 'http://localhost:9485',
			'gas limit': '100000',
			'gas price': '1000000000',
			'gwei value': '0',
			storage_contract: storageContractAddress,
			data: 'Nel mezzo del cammin di nostra vita\nmi ritrovai per una selva oscura,\nché la diritta via era smarrita.',
		},
	});

	t.truthy(typeof res.result['transaction_id'] === 'string', res.logs);
	transactionId = res.result['transaction_id'] as unknown as string;
});

test.serial('Retrieve a zenroom object', async (t) => {
	const contract = `
Rule unknown ignore
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
			fabchain: 'http://localhost:9485',
			my_tag: transactionId,
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

test('Make slangroom fail', async (t) => {
	const contract = `
Rule unknown ignore
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
					fabchain: 'http://localhost:9485',
				},
			}),
	);
});
