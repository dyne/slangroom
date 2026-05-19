// SPDX-FileCopyrightText: 2026 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
	CallToolResultSchema,
	ListResourcesResultSchema,
	ListToolsResultSchema,
	ReadResourceResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer, loadKnowledgeBase } from '@slangroom/mcp';

const createConnectedClient = async () => {
	const server = createServer();
	const client = new Client({
		name: 'slangroom-mcp-test-client',
		version: '1.0.0',
	});
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
	return { client, server, clientTransport, serverTransport };
};

test('knowledge base loads statement catalog and sources', async (t) => {
	const kb = await loadKnowledgeBase();
	const timestamp = kb.statements.find((statement) => statement.phrase === 'fetch the local timestamp in seconds');
	t.truthy(timestamp);
	t.true((timestamp?.exampleSourceIds.length ?? 0) > 0);
	t.true(kb.sources.some((source) => source.kind === 'example'));
	t.true(kb.sources.some((source) => source.kind === 'test'));
});

test('mcp exposes tools and resources', async (t) => {
	const { client, clientTransport, serverTransport } = await createConnectedClient();
	const tools = await client.request({ method: 'tools/list' }, ListToolsResultSchema);
	t.deepEqual(
		tools.tools.map((tool) => tool.name).sort(),
		['draft_contract', 'list_statements', 'search_contract_sources', 'validate_contract'],
	);

	const resources = await client.request({ method: 'resources/list' }, ListResourcesResultSchema);
	t.true(resources.resources.some((resource) => resource.uri === 'slangroom://syntax/reference'));
	t.true(resources.resources.some((resource) => resource.uri === 'slangroom://sources/index'));

	await clientTransport.close();
	await serverTransport.close();
});

test('draft_contract produces a valid timestamp contract', async (t) => {
	const { client, clientTransport, serverTransport } = await createConnectedClient();

	const listStatements = await client.request(
		{
			method: 'tools/call',
			params: {
				name: 'list_statements',
				arguments: { plugin: 'timestamp', query: 'seconds' },
			},
		},
		CallToolResultSchema,
	);
	const listPayload = listStatements.structuredContent as { statements: Array<{ id: string }> };
	const statementId = listPayload.statements[0]?.id;
	t.truthy(statementId);

	const draft = await client.request(
		{
			method: 'tools/call',
			params: {
				name: 'draft_contract',
				arguments: {
					statement_id: statementId,
					output: 'timestamp',
				},
			},
		},
		CallToolResultSchema,
	);
	const draftPayload = draft.structuredContent as {
		script: string;
		data: Record<string, unknown>;
		keys: Record<string, unknown>;
	};
	t.true(draftPayload.script.includes("Given I fetch the local timestamp in seconds and output into 'timestamp'"));

	const validation = await client.request(
		{
			method: 'tools/call',
			params: {
				name: 'validate_contract',
				arguments: {
					contract: draftPayload.script,
					data: draftPayload.data,
					keys: draftPayload.keys,
				},
			},
		},
		CallToolResultSchema,
	);
	const validationPayload = validation.structuredContent as { ok: boolean; errors: unknown[] };
	t.true(validationPayload.ok);

	await clientTransport.close();
	await serverTransport.close();
});

test('search_contract_sources returns examples and resources are readable', async (t) => {
	const { client, clientTransport, serverTransport } = await createConnectedClient();

	const search = await client.request(
		{
			method: 'tools/call',
			params: {
				name: 'search_contract_sources',
				arguments: {
					plugin: 'helpers',
					query: 'manipulate and get',
					source_kind: 'example',
					limit: 1,
				},
			},
		},
		CallToolResultSchema,
	);
	const payload = search.structuredContent as {
		sources: Array<{ uri: string; kind: string }>;
	};
	t.is(payload.sources[0]?.kind, 'example');

	const resource = await client.request(
		{
			method: 'resources/read',
			params: { uri: payload.sources[0]!.uri },
		},
		ReadResourceResultSchema,
	);
	const firstContent = resource.contents[0];
	t.true(
		firstContent !== undefined &&
			'text' in firstContent &&
			typeof firstContent.text === 'string' &&
			firstContent.text.includes('## Contract'),
	);

	await clientTransport.close();
	await serverTransport.close();
});

test('validate_contract reports missing bindings for unresolved references', async (t) => {
	const { client, clientTransport, serverTransport } = await createConnectedClient();
	const validation = await client.request(
		{
			method: 'tools/call',
			params: {
				name: 'validate_contract',
				arguments: {
					contract:
						"Rule unknown ignore\nGiven I send object 'missing_object' and send path 'missing_path' and manipulate and get and output into 'result'\nThen print the data\n",
					data: {},
					keys: {},
				},
			},
		},
		CallToolResultSchema,
	);
	const payload = validation.structuredContent as {
		ok: boolean;
		missing_bindings: string[];
	};
	t.false(payload.ok);
	t.true(payload.missing_bindings.length > 0);

	await clientTransport.close();
	await serverTransport.close();
});
