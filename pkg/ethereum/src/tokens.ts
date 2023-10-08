import { createToken, Lexer } from '@slangroom/deps/chevrotain';
import { Whitespace } from '@slangroom/shared';

export { Whitespace } from '@slangroom/shared';

export const Read = createToken({
	name: 'Read',
	pattern: /read/i,
});

export const Ethereum = createToken({
	name: 'Ethereum',
	pattern: /ethereum/i,
});

export const Nonce = createToken({
	name: 'Nonce',
	pattern: /nonce/i,
});

export const Suggested = createToken({
	name: 'Suggested',
	pattern: /suggested/i,
});

export const Gas = createToken({
	name: 'Gas',
	pattern: /gas/i,
});

export const Price = createToken({
	name: 'Price',
	pattern: /price/i,
});

export const For = createToken({
	name: 'For',
	pattern: /for/i,
});

export const With = createToken({
	name: 'With',
	pattern: /with/i,
	group: Lexer.SKIPPED,
});

export const In = createToken({
	name: 'In',
	pattern: /in/i,
});

export const Of = createToken({
	name: 'Of',
	pattern: /of/i,
});

export const Bytes = createToken({
	name: 'Bytes',
	pattern: /bytes/i,
});

export const Hash = createToken({
	name: 'Hash',
	pattern: /hash/i,
});

export const Balance = createToken({
	name: 'Balance',
	pattern: /balance/i,
});

export const Array_ = createToken({
	name: 'Array',
	pattern: /array/i,
});

export const From = createToken({
	name: 'From',
	pattern: /from/i,
});

export const Erc20 = createToken({
	name: 'Erc20',
	pattern: /erc20/i,
});

export const Erc721 = createToken({
	name: 'Erc721',
	pattern: /erc721/i,
});

export const Transaction = createToken({
	name: 'Transaction',
	pattern: /transaction/i,
});

export const Nft = createToken({
	name: 'Nft',
	pattern: /nft/i,
});

export const After = createToken({
	name: 'After',
	pattern: /after/i,
});

export const Broadcast = createToken({
	name: 'Broadcast',
	pattern: /broadcast/i,
});

export const The = createToken({
	name: 'The',
	pattern: /the/i,
});

export const Owner = createToken({
	name: 'Owner',
	pattern: /owner/i,
});

export const Id = createToken({
	name: 'Id',
	pattern: /id/i,
});

export const Asset = createToken({
	name: 'Asset',
	pattern: /asset/i,
});

export const Decimals = createToken({
	name: 'Decimals',
	pattern: /decimals/i,
});

export const Symbol_ = createToken({
	name: 'Symbol',
	pattern: /symbol/i,
});

export const Total = createToken({
	name: 'Total',
	pattern: /total/i,
});

export const Supply = createToken({
	name: 'Supply',
	pattern: /supply/i,
});

export const Name = createToken({
	name: 'Name',
	pattern: /name/i,
});

export const allTokens = [
	Whitespace,
	Read,
	The,
	Ethereum,
	Nonce,
	Suggested,
	Gas,
	Price,
	For,
	With,
	In,
	Of,
	Bytes,
	Hash,
	Balance,
	Array_,
	From,
	Erc20,
	Erc721,
	Transaction,
	Nft,
	After,
	Broadcast,
	Asset,
	Owner,
	Id,
	Symbol_,
	Total,
	Supply,
	Name,
	Decimals,
];
