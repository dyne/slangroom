import { PluginMap, Token, type PluginMapKey } from '@slangroom/core';

export class ParseError extends Error {
	static wrong(have: Token, wantFirst: string, ...wantRest: string[]) {
		const wants = [wantFirst, ...wantRest];
		return new ParseError(
			`"${have.raw}" between (${have.start}, ${have.end}) must be one of: ${wants.join(
				', ',
			)}`,
		);
	}

	static missing(wantFirst: string, ...wantRest: string[]) {
		const wants = [wantFirst, ...wantRest];
		return new ParseError(`missing token(s): ${wants.join(', ')}`);
	}

	static extra(token: Token) {
		return new ParseError(`extra token (${token.start}, ${token.end}): ${token.raw}`);
	}

	/**
	 * @internal
	 */
	constructor(message: string) {
		super(message);
		this.name = 'ParseError';
	}
}

export type Cst = {
	givenThen?: 'given' | 'then';
	errors: ParseError[];
	matches: Match[];
};

export type Match = {
	bindings: Map<string, string>;
	key: PluginMapKey;
	err: ParseError[];
	into?: string;
} & (
	| {
			open?: string;
			connect?: never;
	  }
	| {
			open?: never;
			connect?: string;
	  }
);

export const parse = (p: PluginMap, t: Token[]): Cst => {
	const cst: Cst = {
		matches: [],
		errors: [],
	};
	let givenThen: 'given' | 'then' | undefined;

	// Given or Then
	if (t[0]?.name === 'given') givenThen = 'given';
	else if (t[0]?.name === 'then') givenThen = 'then';
	else if (t[0]) cst.errors.push(ParseError.wrong(t[0], 'given', 'then'));
	else cst.errors.push(ParseError.missing('given', 'then'));

	// TODO: should we allow "that" here ("Given that I")

	// I
	if (t[1]) {
		if (t[1]?.raw !== 'I') cst.errors.push(ParseError.wrong(t[1], 'I'));
	} else {
		cst.errors.push(ParseError.missing('I'));
	}
	p.forEach(([k]) => {
		let i = 1;
		const m: Match = { key: k, bindings: new Map(), err: [] };
		const curErrLen = cst.matches[0]?.err.length;
		const lemmeout = {};
		const newErr = (have: undefined | Token, wantsFirst: string, ...wantsRest: string[]) => {
			if (have) m.err.push(ParseError.wrong(have, wantsFirst, ...wantsRest));
			else m.err.push(ParseError.missing(wantsFirst, ...wantsRest));
			if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
		};
		try {
			// Open 'ident' and|Connect to 'ident' and
			if (k.openconnect === 'open') {
				if (t[++i]?.name !== 'open') newErr(t[i], 'open');
				const ident = t[++i];
				if (ident?.isIdent) m.open = ident.raw.slice(1, -1);
				else newErr(ident, '<identifier>');
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			} else if (k.openconnect === 'connect') {
				if (t[++i]?.name !== 'connect') newErr(t[i], 'connect');
				if (t[++i]?.name !== 'to') newErr(t[i], 'connect');
				const ident = t[++i];
				if (ident?.isIdent) m.connect = ident.raw.slice(1, -1);
				else newErr(ident, '<identifier>');
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			}

			// Send $buzzword 'ident' And
			// TODO: allow spaces in between params
			const params = new Set(k.params);
			k.params?.forEach((name) => {
				if (t[++i]?.name !== 'send') newErr(t[i], 'send');

				const tokName = t[++i];
				if (tokName && params.has(tokName.name)) params.delete(tokName.name);
				else newErr(t[i], name);

				const ident = t[++i];
				if (ident?.isIdent) m.bindings.set(name, ident.raw.slice(1, -1));
				else newErr(ident, '<identifier>');
				if (t[++i]?.name !== 'and') newErr(t[i], 'and');
			});

			// $buzzwords
			k.phrase.split(' ').forEach((name) => t[++i]?.name !== name && newErr(t[i], name));

			// Save Output Into 'ident'
			const ident = t[t.length - 1];
			if (t.length - i >= 5 && ident?.isIdent) {
				for (++i; i < t.length - 4; ++i) m.err.push(ParseError.extra(t[i] as Token));
				if (t[t.length - 4]?.name !== 'and') newErr(t[t.length - 4], 'and');
				if (t[t.length - 3]?.name !== 'output') newErr(t[t.length - 3], 'output');
				if (t[t.length - 2]?.name !== 'into') newErr(t[t.length - 2], 'into');
				if (
					t[t.length - 4]?.name === 'and' &&
					t[t.length - 3]?.name === 'output' &&
					t[t.length - 2]?.name === 'into'
				)
					m.into = ident.raw.slice(1, -1);
			} else {
				for (++i; i < t.length; ++i) m.err.push(ParseError.extra(t[i] as Token));
			}

			if (curErrLen !== undefined && m.err.length > curErrLen) throw lemmeout;
			if (curErrLen !== undefined && m.err.length < curErrLen) cst.matches.length = 0;
			cst.matches.push(m);
		} catch (e) {
			if (e !== lemmeout) throw e;
		}
	});

	if (givenThen) cst.givenThen = givenThen;
	return cst;
};
