import { Parser } from '@slangroom/core';

export function parser(this: Parser) {
	this.RULE('httpPhrase', () => {
		this.connect();
		this.OPTION(() => this.sendpass('object'));
		this.token('do');
		this.OPTION1(() => this.SUBRULE(kind));
		this.SUBRULE(method);
		this.into();
	});

	const method = this.RULE('httpMethod', () => {
		this.OR([
			{ ALT: () => this.token('get') },
			{ ALT: () => this.token('post') },
			{ ALT: () => this.token('patch') },
			{ ALT: () => this.token('put') },
			{ ALT: () => this.token('delete') },
		]);
	});

	const kind = this.RULE('httpKind', () => {
		this.OR([
			{ ALT: () => this.token('sequential') },
			{ ALT: () => this.token('parallel') },
			{ ALT: () => this.token('same') },
		]);
	});
}
