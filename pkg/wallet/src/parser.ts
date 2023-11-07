import { Parser } from '@slangroom/core';

export function parser(this: Parser) {
	this.RULE('walletPhrase', () => {
		this.sendpass('jwk');
		this.sendpass1('holder');
		this.sendpass2('object');
		this.sendpassn(3, 'fields');
		this.token('create');
		this.token('vc');
		this.token('sd');
		this.token('jwt');
		this.into();
	});
}
