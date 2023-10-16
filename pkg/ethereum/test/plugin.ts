import anyTest, { TestFn } from 'ava';
import { Web3 } from 'web3';
import { PluginContextTest } from '@slangroom/core';
import { astify, execute } from '@slangroom/ethereum';

const test = anyTest as TestFn<{ web3: Web3 }>;

test('unknown token', async (t) => {
	const { errors } = astify('ouisdhfaiuo');
	if (!errors) {
		t.fail();
		return;
	}
	const { errors: errors2 } = astify('read read read');
	if (!errors2) {
		t.fail();
		return;
	}
	t.truthy(true);
});
test('read the ethereum nonce', async (t) => {
	const { ast, errors } = astify('read the ethereum nonce');
	if (errors) {
		t.fail();
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await execute(ctx, ast);
	t.deepEqual(res, {
		ok: true,
		value: '0',
	});
});

test('Ethereum gas price', async (t) => {
	const { ast, errors } = astify('read the ethereum suggested gas price');
	if (errors) {
		t.fail();
		return;
	}
	const ctx = PluginContextTest.connect('http://78.47.38.223:9485');
	const res = await execute(ctx, ast);
	t.truthy(res.ok);
	if (res.ok) {
		console.log(res.value);
		t.is(typeof res.value, 'string');
	}
});

test('Retrieve a zenroom object', async (t) => {
	const poem =
		'000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000674e656c206d657a7a6f2064656c2063616d6d696e206469206e6f7374726120766974610a6d6920726974726f7661692070657220756e612073656c7661206f73637572612c0a6368c3a9206c612064697269747461207669612065726120736d6172726974612e00000000000000000000000000000000000000000000000000';
	const { ast, errors } = astify('read the ethereum bytes');
	if (errors) {
		t.fail();
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		transaction_id: '0x0467636a2557a1ccdaf10ce17ee74340096c510acfa9181c85756d43a8bed522',
	});
	const res = await execute(ctx, ast);
	t.deepEqual(res, {
		ok: true,
		value: poem,
	});
});

test('Ethereum balance', async (t) => {
	const { ast, errors } = astify('read the ethereum balance');
	if (errors) {
		t.fail();
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		address: '0x2D010920b43aFb54f8d5fB51c9354FbC674b28Fc',
	});
	const res = await execute(ctx, ast);
	t.deepEqual(res, {
		ok: true,
		value: '1000000000000000000000',
	});
});

test('Read the balance of an array of addresses', async (t) => {
	const { ast, errors } = astify('read the Ethereum balance');
	if (errors) {
		t.fail();
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		addresses: [
			'0xc32510251F77382bb9214144D2c488408Ec2047C',
			'0xFf02577F140557190693cFf549025e66119FEA52',
			'0x4743879F5e9dc3fcE41E30380365441E8D14CCEc',
		],
	});
	const res = await execute(ctx, ast);
	t.truthy(res.ok);
	if (res.ok) {
		for (const v of res.value as string[]) t.is(typeof v, 'string');
	}
});
/*
test("Ethereum transaction id after broadcast", async (t) => {
	const ast = line2Ast("Ethereum transaction id after broadcast of 'signed tx'");
	t.deepEqual(ast.value, { kind: EthereumRequestKind.EthereumBroadcast, rawTransaction: 'signed tx'})
})
*/
test('Erc20 method without arg', async (t) => {
	const tokenResult = {
		symbol: 'NMT',
		name: 'Non movable token',
		totalSupply: '1000',
		decimals: '18',
	};
	let k: keyof typeof tokenResult;
	for (k in tokenResult) {
		const { ast, errors } = astify(`read the erc20 ${k}`);
		if (errors) {
			t.fail(errors?.toString());
			return;
		}
		const ctx = new PluginContextTest('http://78.47.38.223:9485', {
			sc: '0x720F72765775bb85EAAa08BB74442F106d3ffA03',
		});
		const res = await execute(ctx, ast);
		t.deepEqual(res, {
			ok: true,
			value: tokenResult[k],
		});
	}
});

test('erc20 with invalid address', async (t) => {
	const { ast, errors } = astify(`read the erc20 symbol`);
	if (errors) {
		t.fail(errors?.toString());
		return;
	}
	const ctx = new PluginContextTest('http://78.47.38.223:9485', {
		sc: '0x720765775bb85EAAa08BB74442F106d3ffA03',
	});
	try {
		await execute(ctx, ast);
	} catch (e) {
		t.truthy(true);
		return;
	}
	t.falsy(true);
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
	const res = await execute(ctx, ast);
	t.deepEqual(res, {
		ok: true,
		value: "100",
	});
})*/

/*test("Erc721 id", async (t) => {
	const { ast, errors } = astify("read the erc721 id in transaction");
	if (errors) {
		t.fail(errors?.toString());
		return;
	}
	const ctx = new PluginContextTest('http://test.fabchain.net:8545', {
		transaction_id: "0xd91928b513cd71f8077e7d8a300761a105102f718eef232e2efaa87f13e129b6"
	});
	const res = await execute(ctx, ast);
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
