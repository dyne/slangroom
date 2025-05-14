// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ava, { type TestFn } from 'ava';
import { PluginContextTest } from '@slangroom/core';
import {
	downloadAndExtract,
	listDirectoryContent,
	readFileContent,
	storeInFile,
} from '@slangroom/fs';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import * as os from 'node:os';
import http from 'http';
import { once } from 'events';
import { AddressInfo } from 'node:net';


const zipBuffer = Buffer.from('UEsDBAoAAAAAADRzTFfps6IEBAAAAAQAAAAHABwAZm9vLnR4dFVUCQADs9cnZWELKWV1eAsAAQToAwAABOgDAABiYXIKUEsBAh4DCgAAAAAANHNMV+mzogQEAAAABAAAAAcAGAAAAAAAAQAAAICBAAAAAGZvby50eHRVVAUAA7PXJ2V1eAsAAQToAwAABOgDAABQSwUGAAAAAAEAAQBNAAAARQAAAAAA', 'base64');

const server = http.createServer((req, res) => {
	if (req.url === '/') {
		res.writeHead(200, { 'Content-Type': 'application/zip' });
		res.end(zipBuffer);
	}
});
await once(server.listen(0), 'listening'); // listen on random free port
const { port } = server.address() as AddressInfo;
const zipUrl = `http://localhost:${port}/`;

// Tests in this file must be run serially, since we're modifying `process.env`

const jsonify = JSON.stringify;
const test = ava as TestFn<string>;

test.beforeEach(async (t) => {
	const tmpdir = await fs.mkdtemp(join(os.tmpdir(), 'slangroom-test-'));
	process.env['FILES_DIR'] = tmpdir;
	t.context = tmpdir;
});

test.afterEach(async (t) => await fs.rm(t.context, { recursive: true }));

test.after.always(() => {
	server.close();
});

// Read the comments of the nock instance above in order to understand how this
// test works.
test.serial('downloadAndExtract works', async (t) => {
	const path = join('foo', 'bar');
	const dir = join(t.context, path);
	const ctx = new PluginContextTest(zipUrl, { path: path });
	const res = await downloadAndExtract(ctx);
	t.deepEqual(res, { ok: true, value: null });
	const content = await fs.readFile(join(dir, 'foo.txt'));
	t.is(content.toString(), 'bar\n');
});

test.serial('readFileContent works', async (t) => {
	const path = 'foo';
	const content = { a: 1, b: 2 };
	await fs.writeFile(join(t.context, path), jsonify(content));
	const ctx = PluginContextTest.params({ path: path });
	const res = await readFileContent(ctx);
	t.deepEqual(res, { ok: true, value: content });
});

test.serial('storeInFile works', async (t) => {
	const path = 'foo';
	const content = { a: 1, b: 2 };
	const ctx = PluginContextTest.params({ path: path, content: content });
	const res = await storeInFile(ctx);
	t.deepEqual(res, { ok: true, value: null });
	const buf = await fs.readFile(join(t.context, path));
	t.is(buf.toString(), jsonify(content));
});

test.serial('listDirectoryContent works', async (t) => {
	const path = join('foo', 'bar');
	const dir = join(t.context, path);
	await fs.mkdir(dir, { recursive: true });
	const files = [join(dir, 'file0'), join(dir, 'file1')];
	await Promise.all(files.map((f) => fs.appendFile(f, '')));
	const stats = await Promise.all(files.map((f) => fs.stat(f)));
	const ctx = PluginContextTest.params({ path: path });
	const value = stats.map((stat, i) => {
		const filepath = files[i] as string;
		return {
			name: filepath,
			mode: stat.mode.toString(8),
			dev: stat.dev,
			nlink: stat.nlink,
			uid: stat.uid,
			gid: stat.gid,
			size: stat.size,
			blksize: stat.blksize,
			blocks: stat.blocks,
			atime: stat.atime.toISOString(),
			mtime: stat.mtime.toISOString(),
			ctime: stat.ctime.toISOString(),
			birthtime: stat.birthtime.toISOString(),
		};
	});
	const want = { ok: true, value: value };
	const have = await listDirectoryContent(ctx);
	t.deepEqual(have, want);
});
