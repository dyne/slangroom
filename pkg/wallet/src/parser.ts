import { Parser } from '@slangroom/core';

export function parser(this: Parser) {
	this.RULE('walletPhrase', () => {
		this.OR([
			{ ALT: () => this.SUBRULE(createVcSdJwt), },
			{ ALT: () => this.SUBRULE(presentVcSdJwt), },
			{ ALT: () => this.SUBRULE(verifyVcSdJwt), },
			{ ALT: () => this.SUBRULE(keyGen), },
			{ ALT: () => this.SUBRULE(pkGen), },
		])
		this.into();
	});

	const createVcSdJwt = this.RULE('createVcSdJwt', () => {
		this.sendpass('jwk');
		this.sendpass1('holder');
		this.sendpass2('object');
		this.sendpassn(3, 'fields');
		this.token('create');
		this.token('vc');
		this.token('sd');
		this.token('jwt');
	})
	const keyGen = this.RULE('keyGen', () => {
		this.token('create');
		this.token('p-256');
		this.token('key');
	})
	const pkGen = this.RULE('pkGen', () => {
		this.sendpass('sk');
		this.token('create');
		this.token('p-256');
		this.token('public');
		this.token('key');
	})
	const presentVcSdJwt = this.RULE('presentVcSdJwt', () => {
		this.sendpass('verifier url');
		this.sendpass1('issued vc');
		this.sendpass2('disclosed');
		this.sendpassn(3, 'nonce');
		this.sendpassn(4, 'holder');
		this.token('present');
		this.token('vc');
		this.token('sd');
		this.token('jwt');
	})
	const verifyVcSdJwt = this.RULE('verifyVcSdJwt', () => {
		this.sendpass('verifier url');
		this.sendpass1('issued vc');
		this.sendpass2('nonce');
		this.sendpassn(3, 'issuer');
		this.token('verify');
		this.token('vc');
		this.token('sd');
		this.token('jwt');
	})
}
