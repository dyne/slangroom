// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import gitpkg from 'isomorphic-git';
// TODO: why does this require index.js?
import http from 'isomorphic-git/http/web/index.js';
import { promises as fs } from 'fs';
import path from 'path';
// read the version from the package.json
import packageJson from '@slangroom/git/package.json' with { type: 'json' };

export const version = packageJson.version;

export class GitError extends Error {
    constructor(e: string) {
        super(e)
        this.name = 'Slangroom @slangroom/git@' + packageJson.version + ' Error'
    }
}

/**
 * @internal
 */
export const sandboxDir = () => {
	if (typeof process === 'undefined') return '.';
	// TODO: sanitize sandboxDir
	return process.env['FILES_DIR'];
};

const sandboxizeDir = (unsafe: string): ({ok: true, dirpath: string} | {ok: false, error: string}) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// Unlike `resolveFilepath`, we allow `.` to be used here, obviously.
	if (doesDirectoryTraversal) return { ok: false, error: `dirpath is unsafe: ${unsafe}` };
	const sandboxdir = sandboxDir();
	if (!sandboxdir) return { ok: false, error: '$FILES_DIR must be provided' };
	return { ok: true, dirpath: path.join(sandboxdir, normalized) };
};

const sandboxizeFile = (sandboxdir: string, unsafe: string): ({ok: true, filepath: string} | {ok: false, error: string}) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// `.` ensures that `foo/bar` or `./foo` is valid, while `.` isn't
	// (that is, no "real" filepath is provided)
	const DoesntProvideFile = normalized.startsWith('.');
	if (doesDirectoryTraversal || DoesntProvideFile)
		return { ok: false, error: `filepath is unsafe: ${unsafe}` };
	return { ok: true, filepath: path.join(sandboxdir, normalized) };
};

const p = new Plugin();

/**
 * @internal
 */
export const verifyGitRepository = p.new('open', 'verify git repository', async (ctx) => {
	const unsafe = ctx.fetchOpen()[0];
	const res = sandboxizeDir(unsafe);
	if (!res.ok) return ctx.fail(new GitError(res.error));

	try {
		await gitpkg.findRoot({ fs: fs, filepath: res.dirpath });
		return ctx.pass(null);
	} catch (e) {
		return ctx.fail(new GitError(e.message));
	}
});

/*
 * @internal
 */
export const cloneRepository = p.new('connect', ['path'], 'clone repository', async (ctx) => {
	const repoUrl = ctx.fetchConnect()[0];
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new GitError('path must be string'));

	const res = sandboxizeDir(unsafe);
	if (!res.ok) return ctx.fail(new GitError(res.error));
	try  {
		await gitpkg.clone({ fs: fs, http: http, dir: res.dirpath, url: repoUrl });
		return ctx.pass(null);
	} catch (e) {
		return ctx.fail(new GitError(e.message));
	}
});

/*
 * @internal
 */
export const createNewGitCommit = p.new('open', ['commit'], 'create new git commit', async (ctx) => {
	const unsafe = ctx.fetchOpen()[0];
	const res = sandboxizeDir(unsafe);
	if (!res.ok) return ctx.fail(new GitError(res.error));

	const commit = ctx.fetch('commit') as {
		message: string;
		author: string;
		email: string;
		files: string[];
	};

	try {
		commit.files.map((unsafe) => {
			const r = sandboxizeFile(res.dirpath, unsafe);
			if (!r.ok) throw new Error(r.error);
			return r.filepath;
		});

		await Promise.all(
			commit.files.map((safe) => {
				return gitpkg.add({
					fs: fs,
					dir: res.dirpath,
					filepath: safe,
				});
			}),
		);

		const hash = await gitpkg.commit({
			fs: fs,
			dir: res.dirpath,
			message: commit.message,
			author: {
				name: commit.author,
				email: commit.email,
			},
		});

		return ctx.pass(hash);
	} catch (e) {
		return ctx.fail(new GitError(e.message));
	}
});

export const git = p;
