import ava, { TestFn } from 'ava';
import { Web3 } from 'web3';
import { PluginContextTest } from '@slangroom/core';
import {
	erc20decimals,
	erc20name,
	erc20symbol,
	erc20totalSupply,
	ethBalanceAddr,
	ethBalanceAddrs,
	ethBytes,
	ethGasPrice,
	ethNonce,
} from '@slangroom/ethereum';

const test = ava as TestFn<{ web3: Web3 }>;

test('read the ethereum nonce', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await ethNonce(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '0',
	});
});

test('Ethereum gas price', async (t) => {
	const ctx = PluginContextTest.connect('http://78.47.38.223:9485');
	const res = await ethGasPrice(ctx);
	t.truthy(res.ok);
	if (res.ok) t.is(typeof res.value, 'string');
});

test('Retrieve a zenroom object', async (t) => {
	const poem =
		'000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000674e656c206d657a7a6f2064656c2063616d6d696e206469206e6f7374726120766974610a6d6920726974726f7661692070657220756e612073656c7661206f73637572612c0a6368c3a9206c612064697269747461207669612065726120736d6172726974612e00000000000000000000000000000000000000000000000000';
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		transaction_id: '0x0467636a2557a1ccdaf10ce17ee74340096c510acfa9181c85756d43a8bed522',
	});
	const res = await ethBytes(ctx);
	t.deepEqual(res, {
		ok: true,
		value: poem,
	});
});

test('Ethereum balance', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await ethBalanceAddr(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '1000000000000000000000',
	});
});

test('Read the balance of an array of addresses', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		addresses: [
			'0xc32510251F77382bb9214144D2c488408Ec2047C',
			'0xFf02577F140557190693cFf549025e66119FEA52',
			'0x4743879F5e9dc3fcE41E30380365441E8D14CCEc',
		],
	});
	const res = await ethBalanceAddrs(ctx);
	t.truthy(res.ok);
	if (res.ok) for (const v of res.value as string[]) t.is(typeof v, 'string');
});

test('erc20 symbol()', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: '0x720F72765775bb85EAAa08BB74442F106d3ffA03',
	});
	const res = await erc20symbol(ctx);
	t.deepEqual(res, {
		ok: true,
		value: 'NMT',
	});
});

test('erc20 name()', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: '0x720F72765775bb85EAAa08BB74442F106d3ffA03',
	});
	const res = await erc20name(ctx);
	t.deepEqual(res, {
		ok: true,
		value: 'Non movable token',
	});
});

test('erc20 totalSupply()', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: '0x720F72765775bb85EAAa08BB74442F106d3ffA03',
	});
	const res = await erc20totalSupply(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '1000',
	});
});

test('erc20 decimals()', async (t) => {
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: '0x720F72765775bb85EAAa08BB74442F106d3ffA03',
	});
	const res = await erc20decimals(ctx);
	t.deepEqual(res, {
		ok: true,
		value: '18',
	});
});

test('erc20 with invalid address', async (t) => {
	const sc = '0x720765775bb85EAAa08BB74442F106d3ffA03';
	const ctx = new PluginContextTest('http://78.47.38.223:9485', { sc: sc });

	const res = await erc20symbol(ctx);
	t.deepEqual(res, {
		ok: false,
		error: `sc must be a valid ethereum address: ${sc}`,
	});
});

/*test("Erc20 method with arg", async (t) => {
	const { ast, errors } = astify("read the erc20 balance");
	if (errors) {
		t.fail(errors?.toString());
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: "0x720F72765775bb85EAAa08BB74442F106d3ffA03",
		address: "0x7d6df85bDBCe99151c813fd1DDE6BC007c523C27"
	});
	const res = await execute(ctx, 'erc20balance');
	t.deepEqual(res, {
		ok: true,
		value: "100",
	});
})*/

/*test("Erc721 id", async (t) => {
	const ctx = new PluginContextTest('http://test.fabchain.net:8545', {
		transaction_id: "0xd91928b513cd71f8077e7d8a300761a105102f718eef232e2efaa87f13e129b6"
	});
	const res = await execute(ctx, 'erc712id');
	t.deepEqual(res, {
		ok: true,
		value: "NMT",
	});
})*/
/*
test("Erc721 asset", async (t) => {
	const ast = line2Ast("erc721 asset in 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Asset, address: 'address', nftId: 'nft_id' })
})

test("Erc721 owner", async (t) => {
	const ast = line2Ast("erc721 owner of 'nft_id' for 'address'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.Erc721Owner, address: 'address', nftId: 'nft_id' })
})
*/
