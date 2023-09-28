import anyTest, {TestFn} from 'ava';
import { Web3 } from 'web3'

const test = anyTest as TestFn<{web3: Web3}>;

import { EthereumRequestKind, line2Ast } from '@slangroom/ethereum/read';

test.before(async (t) => {
	t.context.web3 = new Web3('http://78.47.38.223:9485')
});

test("Ethereum nonce", async (t) => {
	const ast = line2Ast("Ethereum nonce for 'foo'");
	t.deepEqual(ast.value, { address: 'foo', kind: EthereumRequestKind.EthereumNonce})
})

test("Ethereum gas price", async (t) => {
	const ast = line2Ast("Ethereum suggested gas price");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumGasPrice})
})

test("Ethereum bytes", async (t) => {
	const ast = line2Ast("Ethereum bytes with hash 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBytes, transactionId: 'foo'})
})

test("Ethereum balance", async (t) => {
	const ast = line2Ast("Ethereum balance for 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBalance, address: 'foo'})
})

test("Ethereum transaction id after broadcast", async (t) => {
	const ast = line2Ast("Ethereum transaction id after broadcast of 'signed tx'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBroadcast, rawTransaction: 'signed tx'})
})

test("Erc20 method without arg", async (t) => {
	const ast = line2Ast("erc20 'symbol' for 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc20Method, address: 'foo' })
})

test("Erc20 method with arg", async (t) => {
	const ast = line2Ast("erc20 'balance' of 'address' for 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc20Method, address: 'foo', arg: 'address' })
})

test("Erc721 id", async (t) => {
	const ast = line2Ast("erc721 id in transaction 'tx id'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Id, transactionId: 'tx id' })
})

test("Erc721 asset", async (t) => {
	const ast = line2Ast("erc721 asset in 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Asset, address: 'address', nftId: 'nft_id' })
})

test("Erc721 owner", async (t) => {
	const ast = line2Ast("erc721 owner of 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Owner, address: 'address', nftId: 'nft_id' })
})
