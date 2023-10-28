import { Parser } from '@slangroom/core';

export function parser(this: Parser) {
	this.RULE('ethereumPhrase', () => {
		this.connect();
		this.OR1([
			{ ALT: () => this.SUBRULE(ethNonce) },
			{ ALT: () => this.SUBRULE(ethBytes) },
			{ ALT: () => this.SUBRULE(ethBalance) },
			{ ALT: () => this.SUBRULE(ethBroadcast) },
			{ ALT: () => this.SUBRULE(ethGasPrice) },
			{ ALT: () => this.SUBRULE(erc20) },
			{ ALT: () => this.SUBRULE(erc721) },
		]);
		this.into();
	});

	const ethNonce = this.RULE('ethereumEthereumNonce', () => {
		this.sendpass('address');
		this.token('read');
		this.token('the');
		this.token('ethereum');
		this.token('nonce');
	});

	const ethBytes = this.RULE('ethereumEthereumBytes', () => {
		this.sendpass('transaction_id');
		this.token('read');
		this.token('the');
		this.token('ethereum');
		this.token('bytes');
	});

	const ethBalance = this.RULE('ethereumEthereumBalance', () => {
		this.sendpass('address');
		this.token('read');
		this.token('the');
		this.token('ethereum');
		this.token('balance');
	});

	const ethBroadcast = this.RULE('ethereumEthereumBroadcast', () => {
		this.sendpass('transaction');
		this.token('read');
		this.token('the');
		this.token('ethereum');
		this.token1('transaction');
		this.token('id');
		this.token('after');
		this.token('broadcast');
	});

	const ethGasPrice = this.RULE('ethereumEthereumGasPrice', () => {
		this.token('read');
		this.token('the');
		this.token('ethereum');
		this.token('suggested');
		this.token('gas');
		this.token('price');
	});

	const erc20 = this.RULE('ethereumErc20', () => {
		this.sendpass('sc');
		this.token('read');
		this.token('the');
		this.token('erc20');
		this.OR2([
			{ ALT: () => this.token('decimals') },
			{ ALT: () => this.token('name') },
			{ ALT: () => this.token('symbol') },
			{ ALT: () => this.token('balance') },
			{
				ALT: () => {
					// TODO: how to handle to vs total?
					this.token('ttal');
					this.token('supply');
				},
			},
		]);
	});

	const erc721 = this.RULE('ethereumErc721', () => {
		this.token('read');
		this.token('the');
		this.token('erc721');
		this.OR([
			{
				ALT: () => {
					this.token('id');
					this.token('in');
					this.token('transaction');
				},
			},
			{ ALT: () => this.token('owner') },
			{ ALT: () => this.token('asset') },
		]);
	});
}
