import anyTest, {TestFn} from 'ava';
import { Web3 } from 'web3'

const test = anyTest as TestFn<{web3: Web3}>;

import { EthereumRequestKind, line2Ast, evaluate } from '@slangroom/ethereum/read';

test.before(async (t) => {
	t.context.web3 = new Web3('http://78.47.38.223:9485')
});

test("Ethereum nonce", async (t) => {
	const ast = line2Ast("Ethereum nonce for 'foo'");
	t.deepEqual(ast.value, { address: 'foo', kind: EthereumRequestKind.EthereumNonce})
	const res = await evaluate(ast.value, {}, {data: {foo: "0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc"}, context: t.context})
	t.is(res, '0');
})

test("Ethereum gas price", async (t) => {
	const ast = line2Ast("Ethereum suggested gas price");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumGasPrice})
	const res = await evaluate(ast.value, {}, {data: {}, context: t.context})
	t.is(typeof res, 'string');
})

test("Retrieve a zenroom object", async (t) => {
	const poem = "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000674e656c206d657a7a6f2064656c2063616d6d696e206469206e6f7374726120766974610a6d6920726974726f7661692070657220756e612073656c7661206f73637572612c0a6368c3a9206c612064697269747461207669612065726120736d6172726974612e00000000000000000000000000000000000000000000000000"
	const ast = line2Ast("Ethereum bytes with hash 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBytes, transactionId: 'foo'})
	const res = await evaluate(ast.value, {}, {data: {foo: '0x0467636a2557a1ccdaf10ce17ee74340096c510acfa9181c85756d43a8bed522'}, context: t.context});
	t.is(res, poem);
})

test("Ethereum balance", async (t) => {
	const ast = line2Ast("Ethereum balance for 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBalance, address: 'foo'})
	const res = await evaluate(ast.value, {}, {data: {foo: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc'}, context: t.context})
	t.is(res, "1000000000000000000000")
})

test("Read the balance of an array of addresses", async (t) => {
	const ast = line2Ast("Ethereum balance for array 'foo'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBalance, address: 'foo'})
	const res = await evaluate(ast.value, {}, {data: {foo: [
			"0xc32510251F77382bb9214144D2c488408Ec2047C",
			"0xFf02577F140557190693cFf549025e66119FEA52",
			"0x4743879F5e9dc3fcE41E30380365441E8D14CCEc"
		]}, context: t.context}) as any[]
	t.is(res.length, 3)
	for (const v of res)
	  t.is(typeof v, "string")
});

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
