import { PluginContext, PluginResult } from '@slangroom/core/plugin';
import { lex, parse, visit, EthereumRequestKind, type PhraseCst } from '@slangroom/ethereum';
import { Web3 } from 'web3';

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

	if (kind == EthereumRequestKind.EthereumNonce) {
		const address = ctx.fetch('address') as string;
		const nonce = await web3.eth.getTransactionCount(address);
		return ctx.pass(nonce.toString());
	}

	if (kind == EthereumRequestKind.EthereumGasPrice) {
		const gasPrice = await web3.eth.getGasPrice();
		return ctx.pass(gasPrice.toString());
	}

	if (kind == EthereumRequestKind.EthereumBalance) {
		// TODO: different statement for string and array
		const address = ctx.fetch('address');
		if (Array.isArray(address)) {
			const balances = await Promise.all(
				address.map((addr) => web3.eth.getBalance(addr as string))
			);
			return ctx.pass(balances.map((b) => b.toString()));
		} else {
			return ctx.pass((await web3.eth.getBalance(address as string)).toString());
		}
	}
	// if (kind == EthereumRequestKind.EthereumBytes) {
	// 	const tag = ctx.fetch('transaction_id') as string;
	// 	const receipt = await web3.eth.getTransactionReceipt(
	// 		tag.startsWith('0x') ? tag : '0x' + tag
	// 	);
	// 	if (!receipt) return ctx.fail("Transaction id doesn't exist");
	// 	if (!receipt.status) return ctx.fail('Failed transaction');
	// 	try {
	// 		const dataRead = receipt.logs[0]?.data?.slice(2);
	// 		return ctx.pass(dataRead);
	// 	} catch (e) {
	// 		return ctx.fail('Empty transaction');
	// 	}
	// }
	return ctx.fail('Should not be here');
};

const EthereumPlugin = async (ctx: PluginContext): Promise<PluginResult> => {
	const { ast, errors } = astify(ctx.phrase);
	if (!ast) return ctx.fail(errors);
	return execute(ctx, ast);
};

export const ethereumPlugins = new Set([EthereumPlugin]);
