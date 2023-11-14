import type { Cst, PluginMapKey } from '@slangroom/core';
import type { Jsonable, ZenParams } from '@slangroom/shared';

export type Ast = {
	key: PluginMapKey;
	params: Map<string, Jsonable>;
	into?: string;
} & (
		| {
			open?: [string, ...string[]];
			connect?: never;
		}
		| {
			open?: never;
			connect?: [string, ...string[]];
		}
	);

export const visit = (cst: Cst, params: ZenParams): Ast => {
	if (cst.errors.length) throw new Error('cst must not have any general errors');
	if (!cst.givenThen) throw new Error('cst must have a given or then');
	if (cst.matches.some((x) => x.err.length > 0))
		throw new Error('cst must not have any match errors');

	const m = cst.matches[0];
	if (!m) throw new Error('cst must have a valid match');

	const ast: Ast = {
		key: m.key,
		params: new Map(),
	};

	if (m.into) ast.into = m.into;
	if (m.open) ast.open = fetchOpen(params, m.open);
	if (m.connect) ast.connect = fetchConnect(params, m.connect);

	m.bindings?.forEach((ident, name) => {
		const val = fetchDatakeys(params, ident);
		ast.params.set(name, val);
	});

	return ast;
};

const getDatakeys = (params: ZenParams, rhs: string): undefined | Jsonable =>
	params.data[rhs] ? params.data[rhs] : params.keys[rhs];

const fetchDatakeys = (params: ZenParams, rhs: string): Jsonable => {
	const val = getDatakeys(params, rhs);
	if (!val) throw new Error('cannot be undefined');
	return val;
};

const getOpen = (params: ZenParams, rhs: string): string[] => {
	const val = getDatakeys(params, rhs);
	if (typeof val === 'string') return [val];
	if (Array.isArray(val)) {
		if (val.every((x) => typeof x === 'string')) return val as string[];
		else throw new Error(`the array referenced by ${rhs} must solely composed of strings`);
	}
	return [];
};

const fetchOpen = (params: ZenParams, rhs: string): [string, ...string[]] => {
	const val = getOpen(params, rhs);
	if (val.length === 0) throw new Error('a connect is required');
	return val as [string, ...string[]];
};

const fetchConnect = (params: ZenParams, rhs: string): [string, ...string[]] =>
	fetchOpen(params, rhs);
