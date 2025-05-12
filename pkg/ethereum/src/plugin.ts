// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin, type PluginExecutor } from '@slangroom/core';
import { erc20abi } from '@slangroom/ethereum';
import { Web3 } from 'web3';
import { isAddress } from 'web3-validator';
// read the version from the package.json
import packageJson from '@slangroom/ethereum/package.json' with { type: 'json' };

export const version = packageJson.version;

const p = new Plugin();

export class EthereumError extends Error {
    constructor(e: string) {
        super(e)
        this.name = 'Slangroom @slangroom/ethereum@' + packageJson.version + ' Error'
    }
}

/*
 * @internal
 */
export const ethNonce = p.new('connect', ['address'], 'read the ethereum nonce', async (ctx) => {
	const web3 = new Web3(ctx.fetchConnect()[0]);
	const addr = ctx.fetch('address');
	if (typeof addr !== 'string') return ctx.fail(new EthereumError('address must be string'));
	const nonce = await web3.eth.getTransactionCount(addr);
	return ctx.pass(nonce.toString());
});

/**
 * @internal
 */
export const ethBytes = p.new(
	'connect',
	['transaction_id'],
	'read the ethereum bytes',
	async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const tag = ctx.fetch('transaction_id');
		if (typeof tag !== 'string') return ctx.fail(new EthereumError('tag must be string'));
		const receipt = await web3.eth.getTransactionReceipt(
			tag.startsWith('0x') ? tag : '0x' + tag,
		);
		if (!receipt) return ctx.fail(new EthereumError("Transaction id doesn't exist"));
		if (!receipt.status) return ctx.fail(new EthereumError('Failed transaction'));
		try {
			const dataRead = receipt.logs[0]?.data?.slice(2);
			return ctx.pass(dataRead?.toString() || '');
		} catch (e) {
			return ctx.fail(new EthereumError('Empty transaction'));
		}
	},
);

/**
 * @internal
 */
export const ethBalanceAddr = p.new(
	'connect',
	['address'],
	'read the ethereum balance',
	async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const addr = ctx.get('address');
		if (typeof addr !== 'string') return ctx.fail(new EthereumError('address must be string'));
		return ctx.pass((await web3.eth.getBalance(addr)).toString());
	},
);

/**
 * @internal
 */
export const ethBalanceAddrs = p.new(
	'connect',
	['addresses'],
	'read the ethereum balance',
	async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const addrs = ctx.fetch('addresses') as string[]; // next line will ensure type
		if (!Array.isArray(addrs) || !addrs.every((x) => typeof x === 'string'))
			return ctx.fail(new EthereumError('addresses must be string array'));
		const balances = await Promise.all(addrs.map((addr) => web3.eth.getBalance(addr)));
		return ctx.pass(balances.map((b) => b.toString()));
	},
);

/**
 * @internal
 */
export const ethGasPrice = p.new(
	'connect',
	'read the ethereum suggested gas price',
	async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const gasPrice = await web3.eth.getGasPrice();
		return ctx.pass(gasPrice.toString());
	},
);

/**
 * @internal
 */
export const ethBrodcast = p.new(
	'connect',
	['transaction'],
	'read the ethereum transaction id after broadcast',
	async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const rawtx = ctx.fetch('transaction');
		if (typeof rawtx !== 'string') return ctx.fail(new EthereumError('transaction must be string'));
		try {
			const receipt = await web3.eth.sendSignedTransaction(
				rawtx.startsWith('0x') ? rawtx : '0x' + rawtx,
			);
			if (!receipt.status) return ctx.fail(new EthereumError('transaction failed'));
			return ctx.pass(receipt.transactionHash.toString().substring(2)); // remove 0x
		} catch (e) {
			return ctx.fail(new EthereumError(e.message));
		}
	},
);

const erc20helper = (
	name: 'symbol()' | 'decimals()' | 'name()' | 'totalSupply()' | 'balanceOf()',
): PluginExecutor => {
	return async (ctx) => {
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const sc = ctx.fetch('sc');
		if (typeof sc !== 'string') return ctx.fail(new EthereumError('sc must be string'));
		if (!isAddress(sc)) return ctx.fail(new EthereumError(`sc must be a valid ethereum address: ${sc}`));
		const erc20 = new web3.eth.Contract(erc20abi, sc);
		const res = (await erc20.methods[name]?.().call())?.toString();
		if (!res) return ctx.fail(new EthereumError(`${name} call failed`));
		return ctx.pass(res);
	};
};

/**
 * @internal
 */
export const erc20decimals = p.new(
	'connect',
	['sc'],
	'read the erc20 decimals',
	erc20helper('decimals()'),
);

/**
 * @internal
 */
export const erc20name = p.new('connect', ['sc'], 'read the erc20 name', erc20helper('name()'));

/**
 * @internal
 */
export const erc20symbol = p.new(
	'connect',
	['sc'],
	'read the erc20 symbol',
	erc20helper('symbol()'),
);

/**
 * @internal
 */
export const erc20balance = p.new(
	'connect',
	['sc', 'address'],
	'read the erc20 balance',
	erc20helper('balanceOf()'),
);

/**
 * @internal
 */
export const erc20totalSupply = p.new(
	'connect',
	['sc'],
	'read the erc20 total supply',
	erc20helper('totalSupply()'),
);

/**
 * @internal
 */
export const erc721id = p.new(
	'connect',
	['transaction_id'],
	'read the erc721 id in transaction',
	async (ctx) => {
		const ERC721_TRANSFER_EVENT =
			'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
		const web3 = new Web3(ctx.fetchConnect()[0]);
		const tag = ctx.fetch('transaction_id') as string;
		const receipt = await web3.eth.getTransactionReceipt(
			tag.startsWith('0x') ? tag : '0x' + tag,
		);
		const log = receipt.logs.find(
			(v) => v && v.topics && v.topics.length > 0 && v.topics[0] === ERC721_TRANSFER_EVENT,
		);
		if (!log || !log.topics) return ctx.fail(new EthereumError('Token Id not found'));
		return ctx.pass(parseInt(log.topics[3]?.toString() || '', 16));
	},
);

/**
 * @internal
 */
export const erc712owner = p.new('connect', 'read the erc721 owner', async (ctx) => {
	return ctx.fail(new EthereumError('not implemented'));
});

/**
 * @internal
 */
export const erc721asset = p.new('connect', 'read the erc721 asset', async (ctx) => {
	return ctx.fail(new EthereumError('not implemented'));
});

export const ethereum = p;
