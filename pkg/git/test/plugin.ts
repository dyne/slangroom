// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ava, { type TestFn } from 'ava';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import * as os from 'node:os';
import git from 'isomorphic-git';
import { PluginContextTest } from '@slangroom/core';
import { cloneRepository, createNewGitCommit, verifyGitRepository } from '@slangroom/git';

const test = ava as TestFn<string>;

test.beforeEach(async (t) => {
	const tmpdir = await fs.mkdtemp(join(os.tmpdir(), 'slangroom-test-'));
	process.env['FILES_DIR'] = tmpdir;
	t.context = tmpdir;
});

test.afterEach(async (t) => await fs.rm(t.context, { recursive: true }));

test.serial('verifyGitRepository works', async (t) => {
	const path = join('foo', 'bar');
	const dir = join(t.context, path);
	await git.init({ fs: fs, dir: dir });
	const ctx = PluginContextTest.open(path);
	const res = await verifyGitRepository(ctx);
	t.deepEqual(res, { ok: true, value: null });
});

// TODO: somehow make this work with nock using dumb http
test.serial('cloneRepository works', async (t) => {
	const path = join('foo', 'bar');
	const dir = join(t.context, path);
	const ctx = new PluginContextTest('https://github.com/srfsh/dumb', {
		path: path,
	});
	const res = await cloneRepository(ctx);
	t.deepEqual(res, { ok: true, value: null });
	const content = await fs.readFile(join(dir, 'README.md'));
	t.is(content.toString(), '# dumb\nA repo only for testing.  It shall never change.\n');
});

test.serial('createNewCommit works', async (t) => {
	const path = join('foo', 'bar');
	const dir = join(t.context, path);
	await git.init({ fs: fs, dir: dir });
	const files = ['file0.txt', 'file1.txt'];
	files.forEach(async (f) => await fs.appendFile(join(dir, f), `test data ${f}`));
	const commitParams = {
		message: 'my message',
		author: 'my author',
		email: 'email@example.com',
		files: files,
	};
	const ctx = new PluginContextTest(path, { commit: commitParams });
	const res = await createNewGitCommit(ctx);
	const hash = await git.resolveRef({ fs: fs, dir: dir, ref: 'HEAD' });
	t.deepEqual(res, { ok: true, value: hash });
	const { commit } = await git.readCommit({ fs: fs, dir: dir, oid: hash });
	t.is(commit.author.name, commitParams.author);
	t.is(commit.author.email, commitParams.email);
	// newline is required
	t.is(commit.message, `${commitParams.message}\n`);
});
