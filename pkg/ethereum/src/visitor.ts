import {
	CstVisitor,
	type Erc20Cst,
	type Erc721Cst,
	type EthereumCst,
	type PhraseCst,
} from '@slangroom/ethereum';

import {
	type CstNode,
	type CstElement,
} from '@slangroom/deps/chevrotain';

export enum EthereumRequestKind {
	EthereumNonce,
	EthereumGasPrice,
	EthereumBytes,
	EthereumBalance,
	EthereumBroadcast,
	Erc20Balance,
	Erc20Name,
	Erc20Symbol,
	Erc20TotalSupply,
	Erc20Decimals,
	Erc721Id,
	Erc721Owner,
	Erc721Asset,
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface V {
	visit(cst: PhraseCst): ReturnType<this['phrase']>;
	visit(cst: EthereumCst): ReturnType<this['ethereum']>;
	visit(cst: Erc20Cst): ReturnType<this['erc20']>;
	visit(cst: Erc721Cst): ReturnType<this['erc721']>;
	visit(cst: CstNode | CstElement[]): EthereumRequestKind;
}

class V extends CstVisitor {
	constructor() {
		super();
		this.validateVisitor();
	}

	phrase(ctx: PhraseCst['children']): EthereumRequestKind {
		return this.visit(ctx.ethereum || ctx.erc20 || ctx.erc721);
	}

	ethereum(ctx: EthereumCst['children']): EthereumRequestKind {
		if (ctx.Nonce) return EthereumRequestKind.EthereumNonce;
		if (ctx.Balance) return EthereumRequestKind.EthereumBalance;
		if (ctx.Bytes) return EthereumRequestKind.EthereumBytes;
		if (ctx.gasPrice) return EthereumRequestKind.EthereumGasPrice;
		if (ctx.broadcast) return this.visit(ctx.broadcast);
		throw new Error('Should not be here!! (ethereum)');
	}

	erc20(ctx: Erc20Cst['children']): EthereumRequestKind {
		if (ctx.Decimals) return EthereumRequestKind.Erc20Decimals;
		if (ctx.Symbol) return EthereumRequestKind.Erc20Symbol;
		if (ctx.Name) return EthereumRequestKind.Erc20Name;
		if (ctx.Balance) return EthereumRequestKind.Erc20Balance;
		if (ctx.totalSupply) return this.visit(ctx.totalSupply);
		throw new Error('Should not be here!! (erc20)');
	}

	erc721(ctx: Erc721Cst['children']): EthereumRequestKind {
		if (ctx.Asset) return EthereumRequestKind.Erc721Asset;
		if (ctx.Owner) return EthereumRequestKind.Erc721Owner;
		if (ctx.id) return EthereumRequestKind.Erc721Id;
		throw new Error('Should not be here!! (erc721)');
	}

	broadcast() {
		return EthereumRequestKind.EthereumBroadcast;
	}
	gasPrice() {
		return EthereumRequestKind.EthereumGasPrice;
	}
	totalSupply() {
		return EthereumRequestKind.Erc20TotalSupply;
	}
	id() {
		return EthereumRequestKind.Erc721Id
	}
}

const Visitor = new V();

export const visit = (cst: PhraseCst): EthereumRequestKind => Visitor.visit(cst);
