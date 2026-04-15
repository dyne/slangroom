// SPDX-FileCopyrightText: 2026 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
	type CallToolResult,
	type ListResourcesResult,
	type ListToolsResult,
	type ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { JsonableObject } from '@slangroom/shared';
import {
	buildDraft,
	formatSourceResource,
	loadKnowledgeBase,
	searchSources,
	searchStatements,
	validateContract,
	type SourceKind,
} from './catalog.js';

const SERVER_INFO = {
	name: 'slangroom-mcp',
	version: '1.0.0',
};

const TOOL_DEFINITIONS: ListToolsResult['tools'] = [
	{
		name: 'list_statements',
		description:
			'List Slangroom statement definitions from the live syntax reference, with example and test coverage.',
		inputSchema: {
			type: 'object',
			properties: {
				plugin: { type: 'string', description: 'Optional plugin filter such as helpers, http, or wallet.' },
				query: { type: 'string', description: 'Optional free-text phrase filter.' },
				limit: { type: 'number', description: 'Maximum number of statements to return.' },
			},
			additionalProperties: false,
		},
	},
	{
		name: 'search_contract_sources',
		description:
			'Search example contracts and test snippets that use valid Slangroom syntax.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Free-text search over titles and contract bodies.' },
				plugin: { type: 'string', description: 'Optional plugin filter.' },
				source_kind: {
					type: 'string',
					enum: ['all', 'example', 'test'],
					description: 'Restrict the search corpus.',
				},
				limit: { type: 'number', description: 'Maximum number of sources to return.' },
			},
			additionalProperties: false,
		},
	},
	{
		name: 'draft_contract',
		description:
			'Generate a minimal Slangroom contract draft and starter data bundle for a chosen statement.',
		inputSchema: {
			type: 'object',
			properties: {
				statement_id: { type: 'string', description: 'Statement id returned by list_statements.' },
				format: {
					type: 'string',
					enum: ['given_then', 'prepare_compute'],
					description: 'Draft format to use.',
				},
				phase: {
					type: 'string',
					enum: ['Given', 'Then', 'Prepare', 'Compute'],
					description: 'Leading phase keyword.',
				},
				output: { type: 'string', description: 'Output variable name. Empty string omits output storage.' },
				secret_output: { type: 'boolean', description: 'Store output in keys instead of data.' },
				connect_ref: { type: 'string', description: 'Identifier used in the connect clause.' },
				open_ref: { type: 'string', description: 'Identifier used in the open clause.' },
				param_refs: {
					type: 'object',
					description: 'Override placeholder identifiers for statement params.',
					additionalProperties: { type: 'string' },
				},
				include_scenario: { type: 'string', description: 'Optional scenario title.' },
				include_rule_unknown_ignore: { type: 'boolean', description: 'Include the Rule unknown ignore header.' },
				include_print_data: { type: 'boolean', description: 'Append Then print the data when applicable.' },
			},
			required: ['statement_id'],
			additionalProperties: false,
		},
	},
	{
		name: 'validate_contract',
		description:
			'Validate Slangroom-focused contract syntax and optionally verify that referenced data and key bindings exist.',
		inputSchema: {
			type: 'object',
			properties: {
				contract: { type: 'string', description: 'Full contract text to validate.' },
				data: { type: 'object', description: 'Optional data heap for binding checks.', additionalProperties: true },
				keys: { type: 'object', description: 'Optional keys heap for binding checks.', additionalProperties: true },
			},
			required: ['contract'],
			additionalProperties: false,
		},
	},
];

const asObject = (value: unknown): Record<string, unknown> => {
	if (value === undefined) return {};
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('Tool arguments must be a JSON object');
	}
	return value as Record<string, unknown>;
};

const readOptionalString = (args: Record<string, unknown>, key: string): string | undefined => {
	const value = args[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'string') throw new Error(`${key} must be a string`);
	return value;
};

const readRequiredString = (args: Record<string, unknown>, key: string): string => {
	const value = readOptionalString(args, key);
	if (value === undefined) throw new Error(`${key} is required`);
	return value;
};

const readOptionalBoolean = (args: Record<string, unknown>, key: string): boolean | undefined => {
	const value = args[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'boolean') throw new Error(`${key} must be a boolean`);
	return value;
};

const readOptionalNumber = (args: Record<string, unknown>, key: string): number | undefined => {
	const value = args[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'number' || Number.isNaN(value)) throw new Error(`${key} must be a number`);
	return value;
};

const readOptionalStringMap = (
	args: Record<string, unknown>,
	key: string,
): Record<string, string> | undefined => {
	const value = args[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`${key} must be an object`);
	}
	const parsed: Record<string, string> = {};
	for (const [entryKey, entryValue] of Object.entries(value)) {
		if (typeof entryValue !== 'string') throw new Error(`${key}.${entryKey} must be a string`);
		parsed[entryKey] = entryValue;
	}
	return parsed;
};

const readOptionalJsonObject = (
	args: Record<string, unknown>,
	key: string,
): JsonableObject | undefined => {
	const value = args[key];
	if (value === undefined) return undefined;
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error(`${key} must be an object`);
	}
	return value as JsonableObject;
};

const limitResults = <T>(values: T[], limit?: number): T[] => {
	if (limit === undefined) return values;
	return values.slice(0, Math.max(0, Math.trunc(limit)));
};

const textResult = (text: string, structuredContent?: Record<string, unknown>): CallToolResult => ({
	content: [{ type: 'text', text }],
	...(structuredContent ? { structuredContent } : {}),
});

const formatStatementList = async (args: Record<string, unknown>): Promise<CallToolResult> => {
	const kb = await loadKnowledgeBase();
	const plugin = readOptionalString(args, 'plugin');
	const query = readOptionalString(args, 'query');
	const limit = readOptionalNumber(args, 'limit');
	const statements = limitResults(searchStatements(kb.statements, query, plugin), limit);
	const payload = statements.map((statement) => ({
		id: statement.id,
		plugin: statement.plugin,
		openconnect: statement.openconnect ?? null,
		params: statement.params,
		phrase: statement.phrase,
		example_source_ids: statement.exampleSourceIds,
		test_source_ids: statement.testSourceIds,
		given_then_template: statement.givenThenTemplate,
		prepare_compute_template: statement.prepareComputeTemplate,
	}));

	const lines = statements.flatMap((statement) => [
		`- ${statement.id}`,
		`  ${statement.givenThenTemplate}`,
		`  examples=${statement.exampleSourceIds.length} tests=${statement.testSourceIds.length}`,
	]);

	return textResult(lines.length === 0 ? 'No statement definitions matched.' : lines.join('\n'), {
		statements: payload,
	});
};

const formatSourceSearch = async (args: Record<string, unknown>): Promise<CallToolResult> => {
	const kb = await loadKnowledgeBase();
	const query = readOptionalString(args, 'query');
	const plugin = readOptionalString(args, 'plugin');
	const limit = readOptionalNumber(args, 'limit');
	const sourceKind = (readOptionalString(args, 'source_kind') ?? 'all') as SourceKind | 'all';
	const sources = limitResults(searchSources(kb.sources, query, plugin, sourceKind), limit);
	const payload = sources.map((source) => ({
		id: source.id,
		uri: source.uri,
		kind: source.kind,
		plugin: source.plugin ?? null,
		title: source.title,
		source_file: source.sourceFile,
		matched_statement_ids: source.matchedStatementIds,
		validation_errors: source.validationErrors,
		contract_preview: source.contract.split('\n').slice(0, 8).join('\n'),
	}));
	const lines = sources.flatMap((source) => [
		`- ${source.id} (${source.kind})`,
		`  ${source.title}`,
		`  ${source.uri}`,
	]);
	return textResult(lines.length === 0 ? 'No example or test sources matched.' : lines.join('\n'), {
		sources: payload,
	});
};

const formatDraft = async (args: Record<string, unknown>): Promise<CallToolResult> => {
	const kb = await loadKnowledgeBase();
	const statementId = readRequiredString(args, 'statement_id');
	const statement = kb.statementById.get(statementId);
	if (!statement) throw new Error(`Unknown statement_id: ${statementId}`);

	const draftOptions: Parameters<typeof buildDraft>[1] = {};
	const format = readOptionalString(args, 'format') as 'given_then' | 'prepare_compute' | undefined;
	const phase = readOptionalString(args, 'phase') as 'Given' | 'Then' | 'Prepare' | 'Compute' | undefined;
	const output = readOptionalString(args, 'output');
	const secretOutput = readOptionalBoolean(args, 'secret_output');
	const connectRef = readOptionalString(args, 'connect_ref');
	const openRef = readOptionalString(args, 'open_ref');
	const paramRefs = readOptionalStringMap(args, 'param_refs');
	const includeScenario = readOptionalString(args, 'include_scenario');
	const includeRuleUnknownIgnore = readOptionalBoolean(args, 'include_rule_unknown_ignore');
	const includePrintData = readOptionalBoolean(args, 'include_print_data');
	if (format) draftOptions.format = format;
	if (phase) draftOptions.phase = phase;
	if (output !== undefined) draftOptions.output = output;
	if (secretOutput !== undefined) draftOptions.secretOutput = secretOutput;
	if (connectRef) draftOptions.connectRef = connectRef;
	if (openRef) draftOptions.openRef = openRef;
	if (paramRefs) draftOptions.paramRefs = paramRefs;
	if (includeScenario) draftOptions.includeScenario = includeScenario;
	if (includeRuleUnknownIgnore !== undefined) {
		draftOptions.includeRuleUnknownIgnore = includeRuleUnknownIgnore;
	}
	if (includePrintData !== undefined) draftOptions.includePrintData = includePrintData;
	const draft = buildDraft(statement, draftOptions);

	const referenceSources = [
		...statement.exampleSourceIds.map((id) => kb.sourceById.get(id)).filter((source) => source !== undefined),
		...statement.testSourceIds.map((id) => kb.sourceById.get(id)).filter((source) => source !== undefined),
	].slice(0, 6);

	const text = [
		`Statement: ${statement.id}`,
		'',
		'```gherkin',
		draft.script,
		'```',
		'',
		'Starter data:',
		'```json',
		JSON.stringify(draft.data, null, 2),
		'```',
		'',
		'Starter keys:',
		'```json',
		JSON.stringify(draft.keys, null, 2),
		'```',
		'',
		'Reference sources:',
		...referenceSources.map((source) => `- ${source.id}: ${source.title}`),
	].join('\n');

	return textResult(text, {
		statement_id: statement.id,
		script: draft.script,
		data: draft.data,
		keys: draft.keys,
		reference_source_ids: referenceSources.map((source) => source.id),
	});
};

const formatValidation = async (args: Record<string, unknown>): Promise<CallToolResult> => {
	const kb = await loadKnowledgeBase();
	const contract = readRequiredString(args, 'contract');
	const data = readOptionalJsonObject(args, 'data');
	const keys = readOptionalJsonObject(args, 'keys');
	const params = data || keys ? ({ ...(data ? { data } : {}), ...(keys ? { keys } : {}) }) : undefined;
	const validation = validateContract(contract, kb.pluginMap, kb.statements, params);

	const statementLookup = new Map(
		kb.statements.map((statement) => [
			`${statement.phrase}:${statement.openconnect ?? ''}:${statement.params.join(',')}`,
			statement.id,
		]),
	);

	const matchedStatements = validation.matchedStatements.map((statement) => ({
		line_no: statement.lineNo,
		statement_id:
			statementLookup.get(
				`${statement.phrase}:${statement.openconnect ?? ''}:${statement.params.join(',')}`,
			) ?? null,
		plugin: statement.plugin,
		phrase: statement.phrase,
		openconnect: statement.openconnect ?? null,
		params: statement.params,
		into: statement.into ?? null,
		into_secret: statement.intoSecret ?? null,
	}));

	const lines = [
		validation.ok ? 'Validation passed.' : 'Validation failed.',
		...matchedStatements.map((statement) => `- line ${statement.line_no}: ${statement.phrase}`),
		...validation.errors.map((error) => `- error line ${error.lineNo}: ${error.message}`),
		...validation.missingBindings.map((error) => `- binding: ${error}`),
	];

	return textResult(lines.join('\n'), {
		ok: validation.ok,
		matched_statements: matchedStatements,
		errors: validation.errors,
		missing_bindings: validation.missingBindings,
	});
};

const buildResourceList = async (): Promise<ListResourcesResult> => {
	const kb = await loadKnowledgeBase();
	return {
		resources: [
			{
				uri: 'slangroom://syntax/reference',
				name: 'syntax-reference',
				title: 'Slangroom Syntax Reference',
				description: 'Committed syntax reference generated from the live statement catalog.',
				mimeType: 'text/markdown',
			},
			{
				uri: 'slangroom://sources/index',
				name: 'source-index',
				title: 'Contract Source Index',
				description: 'All example and test bundles known to the Slangroom MCP server.',
				mimeType: 'text/markdown',
			},
			...kb.sources.map((source) => ({
				uri: source.uri,
				name: source.id,
				title: source.title,
				description: `${source.kind} source from ${source.sourceFile}`,
				mimeType: 'text/markdown',
			})),
		],
	};
};

const readResource = async (uri: string): Promise<ReadResourceResult> => {
	const kb = await loadKnowledgeBase();
	if (uri === 'slangroom://syntax/reference') {
		return {
			contents: [{ uri, mimeType: 'text/markdown', text: kb.syntaxReference }],
		};
	}
	if (uri === 'slangroom://sources/index') {
		const body = kb.sources
			.map((source) => `- ${source.id} | ${source.kind} | ${source.title} | ${source.uri}`)
			.join('\n');
		return {
			contents: [{ uri, mimeType: 'text/markdown', text: `# Contract Sources\n\n${body}` }],
		};
	}
	const source = kb.sources.find((candidate) => candidate.uri === uri);
	if (!source) throw new Error(`Unknown resource URI: ${uri}`);
	return {
		contents: [{ uri, mimeType: 'text/markdown', text: formatSourceResource(source) }],
	};
};

export const createServer = () => {
	const server = new Server(SERVER_INFO, {
		capabilities: {
			resources: { listChanged: false },
			tools: { listChanged: false },
		},
		instructions:
			'Use list_statements to inspect valid Slangroom statements, search_contract_sources to retrieve examples/tests, draft_contract to scaffold new scripts, and validate_contract to check syntax and binding references.',
	});

	server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFINITIONS }) as ListToolsResult);

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const args = asObject(request.params.arguments);
		switch (request.params.name) {
			case 'list_statements':
				return formatStatementList(args);
			case 'search_contract_sources':
				return formatSourceSearch(args);
			case 'draft_contract':
				return formatDraft(args);
			case 'validate_contract':
				return formatValidation(args);
			default:
				return textResult(`Unknown tool: ${request.params.name}`, { is_error: true });
		}
	});

	server.setRequestHandler(ListResourcesRequestSchema, async () => buildResourceList());
	server.setRequestHandler(ReadResourceRequestSchema, async (request) => readResource(request.params.uri));

	return server;
};

export const startStdioServer = async () => {
	const server = createServer();
	const transport = new StdioServerTransport();
	setInterval(() => undefined, 1 << 30);
	await server.connect(transport);
	return server;
};
