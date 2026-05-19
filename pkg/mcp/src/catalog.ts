// SPDX-FileCopyrightText: 2026 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	PluginMap,
	type PluginMapKey,
	type PluginResult,
	lex,
	parse,
	visit,
} from '@slangroom/core';
import type { JsonableObject, ZenParams } from '@slangroom/shared';

export type OpenConnect = 'open' | 'connect';
export type StatementFormat = 'given_then' | 'prepare_compute';
export type StatementPhase = 'Given' | 'Then' | 'Prepare' | 'Compute';
export type SourceKind = 'example' | 'test';

export type StatementDefinition = {
	id: string;
	plugin: string;
	openconnect?: OpenConnect;
	params: string[];
	phrase: string;
	givenThenTemplate: string;
	prepareComputeTemplate: string;
	exampleSourceIds: string[];
	testSourceIds: string[];
};

export type ContractSource = {
	id: string;
	uri: string;
	kind: SourceKind;
	name: string;
	title: string;
	plugin?: string;
	sourceFile: string;
	contract: string;
	data?: JsonableObject;
	keys?: JsonableObject;
	meta?: Record<string, unknown>;
	matchedStatementIds: string[];
	validationErrors: string[];
};

export type MatchedStatement = {
	lineNo: number;
	plugin: string;
	phrase: string;
	openconnect?: OpenConnect;
	params: string[];
	into?: string;
	intoSecret?: string;
};

export type ContractValidation = {
	ok: boolean;
	matchedStatements: MatchedStatement[];
	errors: { lineNo: number; message: string }[];
	missingBindings: string[];
};

export type KnowledgeBase = {
	repoRoot: string;
	syntaxReference: string;
	statements: StatementDefinition[];
	statementById: Map<string, StatementDefinition>;
	sources: ContractSource[];
	sourceById: Map<string, ContractSource>;
	pluginMap: PluginMap;
};

const NOOP_EXECUTOR = (): PluginResult => ({ ok: true, value: null });

const SOURCE_MARKER =
	/(^|\n)\s*(Rule\b|Scenario\b|Given\b|Then\b|Prepare\b|Compute\b|When\b|If\b|endif\b|foreach\b|endforeach\b)/i;

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

const countNewlines = (value: string): number => value.split('\n').length - 1;
const splitSearchTokens = (value: string): string[] =>
	value
		.toLowerCase()
		.split(/[^a-z0-9_-]+/)
		.filter((token) => token !== '');

const quoted = (value: string): string => `'${value}'`;

const renderGivenThenTemplate = (
	definition: Pick<StatementDefinition, 'openconnect' | 'params' | 'phrase'>,
	phase: 'Given' | 'Then' = 'Given',
	output = 'result',
) => {
	const clauses: string[] = [];
	if (definition.openconnect === 'connect') {
		clauses.push(`connect to ${quoted('connect_ref')}`);
	}
	if (definition.openconnect === 'open') {
		clauses.push(`open ${quoted('open_ref')}`);
	}
	for (const param of definition.params) {
		clauses.push(`send ${param} ${quoted(`${param}_ref`)}`);
	}
	clauses.push(definition.phrase);
	if (output) {
		clauses.push(`output into ${quoted(output)}`);
	}
	return `${phase} I ${clauses.join(' and ')}`;
};

const renderPrepareComputeTemplate = (
	definition: Pick<StatementDefinition, 'openconnect' | 'params' | 'phrase'>,
	phase: 'Prepare' | 'Compute' = 'Prepare',
	output = 'result',
) => {
	const pieces: string[] = [];
	if (definition.openconnect === 'connect') {
		pieces.push(`connect to ${quoted('connect_ref')}`);
	}
	if (definition.openconnect === 'open') {
		pieces.push(`open ${quoted('open_ref')}`);
	}
	pieces.push(definition.phrase);
	const statement = pieces.join(' and ');
	const params =
		definition.params.length === 0
			? ''
			: ` with ${definition.params
					.map((param) => `${param} ${quoted(`${param}_ref`)}`)
					.join(', ')}`;
	return `${phase} ${quoted(output)}: ${statement}${params}`;
};

const definitionLookupKey = (key: {
	phrase: string;
	openconnect?: OpenConnect;
	params?: string[];
}) => `${key.phrase}:${key.openconnect ?? ''}:${(key.params ?? []).join(',')}`;

export const resolveRepoRoot = async (): Promise<string> => {
	let currentDir = path.dirname(fileURLToPath(import.meta.url));
	for (let i = 0; i < 8; i += 1) {
		try {
			await fs.access(path.join(currentDir, 'docs', 'statements', 'index.md'));
			await fs.access(path.join(currentDir, 'examples'));
			return currentDir;
		} catch {
			const parent = path.dirname(currentDir);
			if (parent === currentDir) break;
			currentDir = parent;
		}
	}
	throw new Error('Unable to resolve the slangroom repository root');
};

const createStatementId = (plugin: string, key: PluginMapKey) =>
	`${plugin}:${key.openconnect ?? 'none'}:${(key.params ?? []).join(',')}:${key.phrase}`;

const buildPluginMap = (definitions: StatementDefinition[]) => {
	const pluginMap = new PluginMap();
	for (const definition of definitions) {
		const key: PluginMapKey = { phrase: definition.phrase };
		if (definition.params.length > 0) key.params = [...definition.params];
		if (definition.openconnect) key.openconnect = definition.openconnect;
		pluginMap.set(key, NOOP_EXECUTOR);
	}
	return pluginMap;
};

const parseStatementReference = async (repoRoot: string): Promise<StatementDefinition[]> => {
	const file = await fs.readFile(path.join(repoRoot, 'docs', 'statements', 'index.md'), 'utf8');
	const lines = file.split('\n');
	const definitions: StatementDefinition[] = [];
	let currentPlugin: string | undefined;

	for (const line of lines) {
		const headerMatch = /^##\s+([a-z0-9-]+)\s+plugin$/i.exec(line.trim());
		if (headerMatch) {
			currentPlugin = headerMatch[1]!.toLowerCase();
			continue;
		}
		if (!currentPlugin || !line.trim().startsWith('|')) {
			continue;
		}
		const columns = line
			.split('|')
			.slice(1, -1)
			.map((column) => column.trim());
		if (columns.length !== 3) continue;
		if (columns[0] === 'open/connect' || /^-+$/.test(columns[0]!.replaceAll(' ', ''))) continue;

		const openconnect = columns[0] === '' ? undefined : (columns[0] as OpenConnect);
		const params = columns[1] === '' ? [] : columns[1]!.split(',').map((param) => param.trim());
		const phrase = columns[2]!;
		const key: PluginMapKey = { phrase };
		if (params.length > 0) key.params = params;
		if (openconnect) key.openconnect = openconnect;
		const definition: StatementDefinition = {
			id: createStatementId(currentPlugin, key),
			plugin: currentPlugin,
			params,
			phrase,
			givenThenTemplate: renderGivenThenTemplate({ ...key, params }),
			prepareComputeTemplate: renderPrepareComputeTemplate({ ...key, params }),
			exampleSourceIds: [],
			testSourceIds: [],
		};
		if (openconnect) definition.openconnect = openconnect;
		definitions.push(definition);
	}

	return definitions;
};

const detectPluginFromTitle = (title: string): string | undefined => {
	const match = /^([a-z0-9-]+)\s+example$/i.exec(title.trim());
	return match?.[1]?.toLowerCase();
};

const classifyLine = (
	line: string,
):
	| 'blank'
	| 'comment'
	| 'rule'
	| 'scenario'
	| 'given-have'
	| 'given-name'
	| 'when'
	| 'if'
	| 'endif'
	| 'foreach'
	| 'endforeach'
	| 'print'
	| 'custom'
	| 'unknown' => {
	const trimmed = line.trim();
	if (trimmed === '') return 'blank';
	if (trimmed.startsWith('#')) return 'comment';
	if (/^rule\b/i.test(trimmed)) return 'rule';
	if (/^scenario\b/i.test(trimmed)) return 'scenario';
	if (/^given\s+i\s+have\b/i.test(trimmed)) return 'given-have';
	if (/^given\s+i\s+am\b/i.test(trimmed) || /^given\s+i?\s*my name is\b/i.test(trimmed))
		return 'given-name';
	if (/^when\s+i\b/i.test(trimmed)) return 'when';
	if (/^if\s+i\s+verify\b/i.test(trimmed)) return 'if';
	if (/^endif\b/i.test(trimmed)) return 'endif';
	if (/^foreach\b/i.test(trimmed)) return 'foreach';
	if (/^endforeach\b/i.test(trimmed)) return 'endforeach';
	if (/^then\s+i?\s*print\b/i.test(trimmed)) return 'print';
	if (/^(given|then)\s+I\b/i.test(trimmed) || /^(prepare|compute)\b/i.test(trimmed)) return 'custom';
	return 'unknown';
};

const errorMessage = (value: unknown): string =>
	value instanceof Error ? value.message : typeof value === 'string' ? value : JSON.stringify(value);

export const validateContract = (
	contract: string,
	pluginMap: PluginMap,
	statements?: StatementDefinition[],
	params?: Partial<ZenParams>,
): ContractValidation => {
	const lines = contract.split('\n');
	const errors: { lineNo: number; message: string }[] = [];
	const matchedStatements: MatchedStatement[] = [];
	const missingBindings = new Set<string>();
	const statementLookup = new Map(
		(statements ?? []).map((statement) => [
			definitionLookupKey(statement),
			statement,
		]),
	);

	for (const [index, line] of lines.entries()) {
		const lineNo = index + 1;
		const kind = classifyLine(line);
		if (kind === 'blank' || kind === 'comment') continue;
		if (kind === 'unknown') {
			errors.push({
				lineNo,
				message: 'Line does not match known Slangroom or common Zencode statement shapes',
			});
			continue;
		}
		if (kind !== 'custom') continue;

		const lexed = lex(line.trim(), lineNo);
		if (!lexed.ok) {
			errors.push({ lineNo: lexed.error.lineNo, message: errorMessage(lexed.error.message) });
			continue;
		}

		const cst = parse(pluginMap, ...lexed.value);
		for (const error of cst.errors) {
			errors.push({ lineNo: error.lineNo, message: errorMessage(error.message) });
		}

		const match = cst.matches[0];
		if (!match) {
			errors.push({ lineNo, message: 'No statement definition matched this line' });
			continue;
		}

		for (const error of match.err) {
			errors.push({ lineNo: error.lineNo, message: errorMessage(error.message) });
		}
		if (cst.errors.length > 0 || match.err.length > 0) continue;

		const definition = statementLookup.get(definitionLookupKey(match.key));
		const matched: MatchedStatement = {
			lineNo,
			plugin: definition?.plugin ?? 'unknown',
			phrase: match.key.phrase,
			params: [...(match.key.params ?? [])],
		};
		if (match.key.openconnect) matched.openconnect = match.key.openconnect;
		if (match.into) matched.into = match.into;
		if (match.intoSecret) matched.intoSecret = match.intoSecret;
		matchedStatements.push(matched);

		if (!params) continue;
		try {
			visit(cst, {
				data: params.data ?? {},
				keys: params.keys ?? {},
				conf: params.conf ?? '',
				extra: params.extra ?? {},
			});
		} catch (error) {
			missingBindings.add(errorMessage(error));
		}
	}

	return {
		ok: errors.length === 0 && missingBindings.size === 0,
		matchedStatements,
		errors,
		missingBindings: [...missingBindings],
	};
};

const readJsonObject = async (filePath: string): Promise<JsonableObject | undefined> => {
	try {
		const value = JSON.parse(await fs.readFile(filePath, 'utf8')) as JsonableObject;
		return value;
	} catch {
		return undefined;
	}
};

const readExamples = async (repoRoot: string): Promise<ContractSource[]> => {
	const examplesDir = path.join(repoRoot, 'examples');
	const plugins = await fs.readdir(examplesDir);
	const sources: ContractSource[] = [];

	for (const plugin of plugins) {
		const pluginDir = path.join(examplesDir, plugin);
		const entries = await fs.readdir(pluginDir);
		const bases = [...new Set(entries.filter((entry) => entry.endsWith('.slang')).map((entry) => entry.slice(0, -6)))];
		for (const base of bases) {
			const contract = await fs.readFile(path.join(pluginDir, `${base}.slang`), 'utf8');
			const meta = await readJsonObject(path.join(pluginDir, `${base}.meta.json`));
			const data = await readJsonObject(path.join(pluginDir, `${base}.data.json`));
			const keys = await readJsonObject(path.join(pluginDir, `${base}.keys.json`));
			const title =
				typeof meta?.['title'] === 'string' && meta['title'] !== ''
					? meta['title']
					: base.replaceAll('_', ' ');
			const source: ContractSource = {
				id: `example:${plugin}/${base}`,
				uri: `slangroom://examples/${plugin}/${encodeURIComponent(base)}`,
				kind: 'example',
				name: base,
				title,
				plugin,
				sourceFile: path.relative(repoRoot, path.join(pluginDir, `${base}.slang`)),
				contract,
				matchedStatementIds: [],
				validationErrors: [],
			};
			if (data) source.data = data;
			if (keys) source.keys = keys;
			if (meta) source.meta = meta as Record<string, unknown>;
			sources.push(source);
		}
	}

	return sources;
};

const readGrammarCases = async (repoRoot: string): Promise<ContractSource[]> => {
	const filePath = path.join(repoRoot, 'grammar', 'test', 'cases.txt');
	const content = await fs.readFile(filePath, 'utf8');
	const lines = content.split('\n');
	const sources: ContractSource[] = [];

	let currentTitle: string | undefined;
	let currentBuffer: string[] = [];
	let currentLineStart = 1;

	const flush = () => {
		if (!currentTitle) return;
		const contract = currentBuffer.join('\n').trim();
		if (contract === '') return;
		const id = `test:grammar/${slugify(currentTitle)}`;
		const source: ContractSource = {
			id,
			uri: `slangroom://tests/${encodeURIComponent(`grammar-${slugify(currentTitle)}`)}`,
			kind: 'test',
			name: slugify(currentTitle),
			title: currentTitle,
			sourceFile: `${path.relative(repoRoot, filePath)}:${currentLineStart}`,
			contract,
			matchedStatementIds: [],
			validationErrors: [],
		};
		const plugin = detectPluginFromTitle(currentTitle);
		if (plugin) source.plugin = plugin;
		sources.push(source);
	};

	for (const [index, line] of lines.entries()) {
		if (line.startsWith('#')) {
			flush();
			currentTitle = line.replace(/^#\s*/, '').trim();
			currentBuffer = [];
			currentLineStart = index + 2;
			continue;
		}
		if (line.trim() === '==>') {
			flush();
			currentTitle = undefined;
			currentBuffer = [];
			continue;
		}
		if (currentTitle) {
			currentBuffer.push(line);
		}
	}
	flush();

	return sources;
};

const readInlineTestContracts = async (repoRoot: string): Promise<ContractSource[]> => {
	const root = path.join(repoRoot, 'pkg');
	const packages = await fs.readdir(root);
	const sources: ContractSource[] = [];

	for (const pkgName of packages) {
		const testDir = path.join(root, pkgName, 'test');
		try {
			await fs.access(testDir);
		} catch {
			continue;
		}
		const queue = [testDir];
		while (queue.length > 0) {
			const current = queue.shift()!;
			const entries = await fs.readdir(current, { withFileTypes: true });
			for (const entry of entries) {
				const absolutePath = path.join(current, entry.name);
				if (entry.isDirectory()) {
					queue.push(absolutePath);
					continue;
				}
				if (!/\.(ts|js|txt)$/.test(entry.name)) continue;
				const file = await fs.readFile(absolutePath, 'utf8');
				const literalRegex = /`([\s\S]*?)`/g;
				let match: RegExpExecArray | null;
				let ordinal = 0;
				while ((match = literalRegex.exec(file)) !== null) {
					const contract = match[1] ?? '';
					if (!SOURCE_MARKER.test(contract)) continue;
					const title = `${pkgName}/${entry.name} snippet ${ordinal + 1}`;
					const lineStart = countNewlines(file.slice(0, match.index)) + 1;
					sources.push({
						id: `test:${pkgName}/${slugify(entry.name)}-${ordinal}`,
						uri: `slangroom://tests/${encodeURIComponent(`${pkgName}-${slugify(entry.name)}-${ordinal}`)}`,
						kind: 'test',
						name: `${slugify(entry.name)}-${ordinal}`,
						title,
						plugin: pkgName,
						sourceFile: `${path.relative(repoRoot, absolutePath)}:${lineStart}`,
						contract: contract.trim(),
						matchedStatementIds: [],
						validationErrors: [],
					});
					ordinal += 1;
				}
			}
		}
	}

	return sources;
};

const annotateSources = (
	sources: ContractSource[],
	statements: StatementDefinition[],
	pluginMap: PluginMap,
) => {
	const lookup = new Map(
		statements.map((statement) => [
			definitionLookupKey(statement),
			statement.id,
		]),
	);

	for (const source of sources) {
		const analysis = validateContract(source.contract, pluginMap, statements);
		source.validationErrors = analysis.errors.map((error) => `line ${error.lineNo}: ${error.message}`);
		source.matchedStatementIds = analysis.matchedStatements
			.map((statement) => lookup.get(definitionLookupKey(statement)))
			.filter((value): value is string => typeof value === 'string');
	}

	for (const statement of statements) {
		statement.exampleSourceIds = sources
			.filter((source) => source.kind === 'example' && source.matchedStatementIds.includes(statement.id))
			.map((source) => source.id);
		statement.testSourceIds = sources
			.filter((source) => source.kind === 'test' && source.matchedStatementIds.includes(statement.id))
			.map((source) => source.id);
	}
};

let cache: KnowledgeBase | undefined;

export const loadKnowledgeBase = async (): Promise<KnowledgeBase> => {
	if (cache) return cache;
	const repoRoot = await resolveRepoRoot();
	const syntaxReference = await fs.readFile(
		path.join(repoRoot, 'docs', 'statements', 'index.md'),
		'utf8',
	);
	const statements = await parseStatementReference(repoRoot);
	const pluginMap = buildPluginMap(statements);
	const sources = [
		...(await readExamples(repoRoot)),
		...(await readGrammarCases(repoRoot)),
		...(await readInlineTestContracts(repoRoot)),
	];
	annotateSources(sources, statements, pluginMap);

	cache = {
		repoRoot,
		syntaxReference,
		statements,
		statementById: new Map(statements.map((statement) => [statement.id, statement])),
		sources,
		sourceById: new Map(sources.map((source) => [source.id, source])),
		pluginMap,
	};
	return cache;
};

export const searchStatements = (
	statements: StatementDefinition[],
	query?: string,
	plugin?: string,
): StatementDefinition[] => {
	const normalizedPlugin = plugin?.toLowerCase();
	const tokens = splitSearchTokens(query ?? '');

	return [...statements]
		.filter((statement) => !normalizedPlugin || statement.plugin === normalizedPlugin)
		.map((statement) => {
			const wordSet = new Set(
				splitSearchTokens(`${statement.plugin} ${statement.phrase} ${statement.params.join(' ')}`),
			);
			const haystack = `${statement.plugin}\n${statement.phrase}\n${statement.params.join('\n')}`;
			let score = 0;
			if (tokens.length === 0) score = 1;
			for (const token of tokens) {
				if (wordSet.has(token)) score += 5;
				else if (haystack.includes(token)) score += 1;
				if (statement.openconnect === token) score += 2;
			}
			return { statement, score };
		})
		.filter(({ score }) => score > 0)
		.sort((left, right) => right.score - left.score || left.statement.phrase.localeCompare(right.statement.phrase))
		.map(({ statement }) => statement);
};

export const searchSources = (
	sources: ContractSource[],
	query?: string,
	plugin?: string,
	kind?: SourceKind | 'all',
): ContractSource[] => {
	const normalizedPlugin = plugin?.toLowerCase();
	const normalizedKind = kind === 'all' ? undefined : kind;
	const tokens = splitSearchTokens(query ?? '');

	return [...sources]
		.filter((source) => !normalizedPlugin || source.plugin === normalizedPlugin)
		.filter((source) => !normalizedKind || source.kind === normalizedKind)
		.map((source) => {
			const haystack = `${source.title}\n${source.contract}\n${source.plugin ?? ''}`.toLowerCase();
			let score = tokens.length === 0 ? 1 : 0;
			for (const token of tokens) {
				if (source.title.toLowerCase().includes(token)) score += 4;
				if ((source.plugin ?? '').includes(token)) score += 2;
				if (haystack.includes(token)) score += 1;
			}
			return { source, score };
		})
		.filter(({ score }) => score > 0)
		.sort((left, right) => right.score - left.score || left.source.title.localeCompare(right.source.title))
		.map(({ source }) => source);
};

export const formatSourceResource = (source: ContractSource): string => {
	const chunks = [`# ${source.title}`, '', `Source: ${source.sourceFile}`, `Kind: ${source.kind}`];
	if (source.plugin) chunks.push(`Plugin: ${source.plugin}`);
	chunks.push('', '## Contract', '```gherkin', source.contract.trim(), '```');
	if (source.data) {
		chunks.push('', '## Data', '```json', JSON.stringify(source.data, null, 2), '```');
	}
	if (source.keys) {
		chunks.push('', '## Keys', '```json', JSON.stringify(source.keys, null, 2), '```');
	}
	if (source.matchedStatementIds.length > 0) {
		chunks.push('', '## Matched Statements');
		for (const statementId of source.matchedStatementIds) {
			chunks.push(`- ${statementId}`);
		}
	}
	if (source.validationErrors.length > 0) {
		chunks.push('', '## Validation Notes');
		for (const error of source.validationErrors) {
			chunks.push(`- ${error}`);
		}
	}
	return chunks.join('\n');
};

export const buildDraft = (
	statement: StatementDefinition,
	options?: {
		format?: StatementFormat;
		phase?: StatementPhase;
		output?: string;
		secretOutput?: boolean;
		connectRef?: string;
		openRef?: string;
		paramRefs?: Record<string, string>;
		includeScenario?: string;
		includeRuleUnknownIgnore?: boolean;
		includePrintData?: boolean;
	},
) => {
	const format = options?.format ?? 'given_then';
	const phase =
		options?.phase ??
		(format === 'given_then' ? 'Given' : 'Prepare');
	const output = options?.output ?? 'result';
	const connectRef = options?.connectRef ?? 'connect_ref';
	const openRef = options?.openRef ?? 'open_ref';
	const paramRefs = options?.paramRefs ?? {};

	const parts: string[] = [];
	if (options?.includeRuleUnknownIgnore ?? true) parts.push('Rule unknown ignore');
	if (options?.includeScenario) parts.push(`Scenario '${statement.plugin}': ${options.includeScenario}`);

	let line = '';
	if (format === 'given_then') {
		const phaseKeyword = phase === 'Then' ? 'Then' : 'Given';
		const clauses: string[] = [];
		if (statement.openconnect === 'connect') {
			clauses.push(`connect to ${quoted(connectRef)}`);
		}
		if (statement.openconnect === 'open') {
			clauses.push(`open ${quoted(openRef)}`);
		}
		for (const param of statement.params) {
			clauses.push(`send ${param} ${quoted(paramRefs[param] ?? `${param}_ref`)}`);
		}
		clauses.push(statement.phrase);
		if (output !== '') {
			const outputClause = options?.secretOutput
				? `output secret into ${quoted(output)}`
				: `output into ${quoted(output)}`;
			clauses.push(outputClause);
		}
		line = `${phaseKeyword} I ${clauses.join(' and ')}`;
	} else {
		const phaseKeyword = phase === 'Compute' ? 'Compute' : 'Prepare';
		const segments: string[] = [];
		if (statement.openconnect === 'connect') {
			segments.push(`connect to ${quoted(connectRef)}`);
		}
		if (statement.openconnect === 'open') {
			segments.push(`open ${quoted(openRef)}`);
		}
		segments.push(statement.phrase);
		const withClause =
			statement.params.length === 0
				? ''
				: ` with ${statement.params
						.map((param) => `${param} ${quoted(paramRefs[param] ?? `${param}_ref`)}`)
						.join(', ')}`;
		const outputClause =
			output === ''
				? `${phaseKeyword}:`
				: options?.secretOutput
					? `${phaseKeyword} secret ${quoted(output)}:`
					: `${phaseKeyword} ${quoted(output)}:`;
		line = `${outputClause} ${segments.join(' and ')}${withClause}`;
	}

	parts.push(line);
	if ((options?.includePrintData ?? true) && phase !== 'Then' && phase !== 'Compute') {
		parts.push('', 'Then print the data');
	}

	const data: JsonableObject = {};
	if (statement.openconnect === 'connect') data[connectRef] = '<fill me>';
	if (statement.openconnect === 'open') data[openRef] = '<fill me>';
	for (const param of statement.params) {
		data[paramRefs[param] ?? `${param}_ref`] = '<fill me>';
	}

	return {
		script: parts.join('\n'),
		data,
		keys: {},
	};
};
