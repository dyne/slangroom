import type { Plugin, PluginContext, PluginResult } from '@slangroom/core';
import type { JsonableArray } from '@slangroom/shared';
import { parser, erc20abi } from '@slangroom/ethereum';
import { Web3 } from 'web3';
import { isAddress } from 'web3-validator';

/**
 * @internal
 */
export const execute = async (
	ctx: PluginContext,
	kind:
		| 'ethNonce'
		| 'ethGasPrice'
		| 'ethBalance'
		| 'ethBytes'
		| 'ethBroadcast'
		| 'erc721id'
		| 'erc721owner'
		| 'erc721asset'
		| 'erc20balance'
		| 'erc20symbol'
		| 'erc20decimals'
		| 'erc20name'
		| 'erc20totalSupply',
): Promise<PluginResult> => {
	const web3 = new Web3(ctx.fetchConnect()[0]);

	if (kind === 'ethNonce') {
		const address = ctx.fetch('address') as string;
		const nonce = await web3.eth.getTransactionCount(address);
		return ctx.pass(nonce.toString());
	}

	if (kind === 'ethGasPrice') {
		const gasPrice = await web3.eth.getGasPrice();
		return ctx.pass(gasPrice.toString());
	}

	if (kind === 'ethBalance') {
		// TODO: different statement for string and array
		const address = ctx.get('address');
		if (address) return ctx.pass((await web3.eth.getBalance(address as string)).toString());
		const addresses = ctx.fetch('addresses');
		if (Array.isArray(addresses)) {
			const balances = await Promise.all(
				addresses.map((addr) => web3.eth.getBalance(addr as string)),
			);
			return ctx.pass(balances.map((b) => b.toString()) as JsonableArray);
		}
	}

	if (kind === 'ethBytes') {
		const tag = ctx.fetch('transaction_id') as string;
		const receipt = await web3.eth.getTransactionReceipt(
			tag.startsWith('0x') ? tag : '0x' + tag,
		);
		if (!receipt) return ctx.fail("Transaction id doesn't exist");
		if (!receipt.status) return ctx.fail('Failed transaction');
		try {
			const dataRead = receipt.logs[0]?.data?.slice(2);
			return ctx.pass(dataRead?.toString() || '');
		} catch (e) {
			return ctx.fail('Empty transaction');
		}
	}

	if (kind === 'ethBroadcast') {
		const rawtx = ctx.fetch('transaction') as string;
		const receipt = await web3.eth.sendSignedTransaction(
			rawtx.startsWith('0x') ? rawtx : '0x' + rawtx,
		);
		if (receipt.status) {
			return ctx.pass(receipt.transactionHash.toString().substring(2)); // Remove 0x
		} else {
			throw new Error('Transaction failed');
		}
	}

	/*if (kind === 'erc20balance') {
		const sc = ctx.fetch("sc") as string;
		//const address = ctx.fetch("address") as string;
		if (!isAddress(sc))
			throw new Error(`Not an ethereum address ${sc}`);
		const erc20 = new web3.eth.Contract(erc20Abi, sc);
		console.log(erc20.methods['balanceOf']?.('ciccio'))

		return ctx.pass(await erc20.methods?.["balanceOf"]?.()?.call() || "");
	}

	if (kind === 'erc721id') {
		const tag = ctx.fetch('transaction_id') as string;
		const receipt = await web3.eth.getTransactionReceipt(
			tag.startsWith('0x') ? tag : '0x' + tag
		);
		const log = receipt.logs.find(
			(v) => v && v.topics && v.topics.length > 0 && v.topics[0] === ERC721_TRANSFER_EVENT
		);
		if (!log || !log.topics)
			throw new Error('Token Id not found');
		return ctx.pass(parseInt(log.topics[3]?.toString() || '', 16));
	} */

	const erc20_0 = new Map([
		['erc20symbol', 'symbol()'],
		['erc20decimals', 'decimals()'],
		['erc20name', 'name()'],
		['erc20totalSupply', 'totalSupply()'],
	]);

	if (erc20_0.has(kind)) {
		const sc = ctx.fetch('sc') as string;
		if (!isAddress(sc)) throw new Error(`Not an ethereum address ${sc}`);
		const erc20 = new web3.eth.Contract(erc20abi, sc);
		return ctx.pass(
			(await erc20.methods[erc20_0.get(kind) || '']?.().call())?.toString() || '',
		);
	}

	return ctx.fail('Should not be here');
};

export const ethereum: Plugin = {
	parser: parser,
	executor: async (ctx) => {
		switch (ctx.phrase) {
			case 'read the ethereum nonce':
				return await execute(ctx, 'ethNonce');
			case 'read the ethereum bytes':
				return await execute(ctx, 'ethBytes');
			case 'read the ethereum balance':
				return await execute(ctx, 'ethBalance');
			case 'read the ethereum suggested gas price':
				return await execute(ctx, 'ethGasPrice');
			case 'read the ethereum transaction id after broadcast':
				return await execute(ctx, 'ethBroadcast');
			case 'read the erc20 decimals':
				return await execute(ctx, 'erc20decimals');
			case 'read the erc20 name':
				return await execute(ctx, 'erc20name');
			case 'read the erc20 symbol':
				return await execute(ctx, 'erc20symbol');
			case 'read the erc20 balance':
				return await execute(ctx, 'erc20balance');
			case 'read the erc20 total supply':
				return await execute(ctx, 'erc20totalSupply');
			case 'read the erc721 id in transaction':
				return await execute(ctx, 'erc721id');
			case 'read the erc721 owner':
				return await execute(ctx, 'erc721owner');
			case 'read the erc721 asset':
				return await execute(ctx, 'erc721asset');
			default:
				return ctx.fail('no match');
		}
	},
};
