import { PluginContext, PluginResult } from '@slangroom/core/plugin';
import {JsonableArray } from '@slangroom/shared/jsonable';
import { lex, parse, visit, EthereumRequestKind, type PhraseCst } from '@slangroom/ethereum';
import { Web3 } from 'web3';

import erc20Abi from '@slangroom/ethereum/erc20_abi'
//const ERC721_ABI = require('./erc721_abi.json');
//const ERC721_METADATA_ABI = require('./erc721_metadata_abi.json');

const ERC721_TRANSFER_EVENT = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

/**
 * @internal
 */
export const astify = (text: string) => {
	const lexed = lex(text);
	if (lexed.errors.length) return { errors: lexed.errors };

	const parsed = parse(lexed.tokens);
	if (parsed.errors.length) return { errors: parsed.errors };

	return { ast: visit(parsed.cst as PhraseCst) };
};

/**
 * @internal
 */
export const execute = async (
	ctx: PluginContext,
	kind: EthereumRequestKind
): Promise<PluginResult> => {
	const web3 = new Web3(ctx.fetchConnect()[0]);

	if (kind === EthereumRequestKind.EthereumNonce) {
		const address = ctx.fetch('address') as string;
		const nonce = await web3.eth.getTransactionCount(address);
		return ctx.pass(nonce.toString());
	}

	if (kind === EthereumRequestKind.EthereumGasPrice) {
		const gasPrice = await web3.eth.getGasPrice();
		return ctx.pass(gasPrice.toString());
	}

	if (kind === EthereumRequestKind.EthereumBalance) {
		// TODO: different statement for string and array
		const address = ctx.get('address');
		if(address) {
			return ctx.pass((await web3.eth.getBalance(address as string)).toString());
		}
		const addresses = ctx.fetch('addresses');
		if (Array.isArray(addresses)) {
			const balances = await Promise.all(
				addresses.map((addr) => web3.eth.getBalance(addr as string))
			);
			return ctx.pass(balances.map((b) => b.toString()) as JsonableArray);
		} else {
			throw new Error("Undefined argument")
		}
	}
	if (kind === EthereumRequestKind.EthereumBytes) {
		const tag = ctx.fetch('transaction_id') as string;
		const receipt = await web3.eth.getTransactionReceipt(
			tag.startsWith('0x') ? tag : '0x' + tag
		);
		if (!receipt) return ctx.fail("Transaction id doesn't exist");
		if (!receipt.status) return ctx.fail('Failed transaction');
		try {
			const dataRead = receipt.logs[0]?.data?.slice(2);
			return ctx.pass(dataRead?.toString() || "");
		} catch (e) {
			return ctx.fail('Empty transaction');
		}
	}
	if (kind === EthereumRequestKind.EthereumBroadcast) {
		const rawtx = ctx.fetch("transaction") as string;
		const receipt = await web3.eth.sendSignedTransaction(rawtx.startsWith('0x') ? rawtx : '0x' + rawtx);
		if (receipt.status) {
			return ctx.pass(receipt.transactionHash.toString().substring(2)); // Remove 0x
		} else {
			throw new Error("Transaction failed");
		}
	}
	const erc20_0 = new Map([
		[EthereumRequestKind.Erc20Symbol, "symbol()"],
		[EthereumRequestKind.Erc20Decimals, "decimals()"],
		[EthereumRequestKind.Erc20Name, "name()"],
		[EthereumRequestKind.Erc20TotalSupply, "totalSupply()"],
	])
	if (erc20_0.has(kind)) {
		const sc = ctx.fetch("sc") as string;
		if(!web3.utils.isAddress(sc)) {
			throw new Error(`Not an ethereum address ${sc}`);
		}
		const erc20 = new web3.eth.Contract(erc20Abi, sc);
		return ctx.pass(await erc20.methods[erc20_0.get(kind) || ""]?.().call() || "");
	}
	/*if (kind === EthereumRequestKind.Erc20Balance) {
		const sc = ctx.fetch("sc") as string;
		//const address = ctx.fetch("address") as string;
		if(!web3.utils.isAddress(sc)) {
			throw new Error(`Not an ethereum address ${sc}`);
		}
		const erc20 = new web3.eth.Contract(erc20Abi, sc);
		console.log(erc20.methods['balanceOf']?.('ciccio'))

		return ctx.pass(await erc20.methods?.["balanceOf"]?.()?.call() || "");
	}*/
	if (kind === EthereumRequestKind.Erc721Id) {
		const tag = ctx.fetch('transaction_id') as string;
		const receipt = await web3.eth.getTransactionReceipt(tag.startsWith('0x') ? tag : '0x' + tag);
        const log = receipt.logs.find(
			v => v && v.topics && v.topics.length > 0 && v.topics[0] === ERC721_TRANSFER_EVENT);
        if(!log || !log.topics) {
          throw new Error("Token Id not found")
        }
		return ctx.pass(parseInt(log.topics[3]?.toString() || "", 16));
	}
	return ctx.fail('Should not be here');
};

const EthereumPlugin = async (ctx: PluginContext): Promise<PluginResult> => {
	const { ast, errors } = astify(ctx.phrase);
	if (errors) return ctx.fail(errors);
	return execute(ctx, ast);
};

export const ethereumPlugins = new Set([EthereumPlugin]);
