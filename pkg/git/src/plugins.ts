import type { PluginContext, PluginResult } from '@slangroom/core';
import git from 'isomorphic-git';
// TODO: why does this require index.js?
import http from 'isomorphic-git/http/node/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * @internal
 */
export const sandboxDir = () => {
	// TODO: sanitize sandboxDir
	const ret = process.env['FILES_DIR'];
	if (!ret) throw new Error('$FILES_DIR must be provided');
	return ret;
};

const sandboxizeDir = (unsafe: string) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// Unlike `resolveFilepath`, we allow `.` to be used here, obviously.
	if (doesDirectoryTraversal) return { error: `dirpath is unsafe: ${unsafe}` };
	return { dirpath: path.join(sandboxDir(), normalized) };
};

const sandboxizeFile = (sandboxdir: string, unsafe: string) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// `.` ensures that `foo/bar` or `./foo` is valid, while `.` isn't
	// (that is, no "real" filepath is provided)
	const DoesntProvideFile = normalized.startsWith('.');
	if (doesDirectoryTraversal || DoesntProvideFile)
		return { error: `filepath is unsafe: ${unsafe}` };
	return { filepath: path.join(sandboxdir, normalized) };
};

/**
 * @internal
 */
export const executeVerifyGitRepository = async (ctx: PluginContext): Promise<PluginResult> => {
	const unsafe = ctx.fetchOpen()[0];
	const { dirpath, error } = sandboxizeDir(unsafe);
	if (!dirpath) return ctx.fail(error);

	try {
		await git.findRoot({ fs: fs, filepath: dirpath });
		return ctx.pass(null);
	} catch (e) {
		return ctx.fail(e);
	}
};

/*
 * @internal
 */
export const executeCloneRepository = async (ctx: PluginContext): Promise<PluginResult> => {
	const repoUrl = ctx.fetchConnect()[0];
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { dirpath, error } = sandboxizeDir(unsafe);
	if (!dirpath) return ctx.fail(error);

	await git.clone({ fs: fs, http: http, dir: dirpath, url: repoUrl });
	return ctx.pass(null);
};

/*
 * @internal
 */
export const executeCreateNewGitCommit = async (ctx: PluginContext): Promise<PluginResult> => {
	const unsafe = ctx.fetchOpen()[0];
	const { dirpath, error } = sandboxizeDir(unsafe);
	if (!dirpath) return ctx.fail(error);

	const commit = ctx.fetch('commit') as {
		message: string;
		author: string;
		email: string;
		files: string[];
	};

	try {
		commit.files.map((unsafe) => {
			const { filepath, error: ferror } = sandboxizeFile(dirpath, unsafe);
			if (!filepath) throw ferror;
			return filepath;
		});
	} catch (e) {
		return ctx.fail(e);
	}

	await Promise.all(
		commit.files.map((safe) => {
			return git.add({
				fs: fs,
				dir: dirpath,
				filepath: safe,
			});
		})
	);

	const hash = await git.commit({
		fs: fs,
		dir: dirpath,
		message: commit.message,
		author: {
			name: commit.author,
			email: commit.email,
		},
	});

	return ctx.pass(hash);
};

const gitPlugin = async (ctx: PluginContext): Promise<PluginResult> => {
	switch (ctx.phrase) {
		case 'verify git repository':
			return await executeVerifyGitRepository(ctx);
		case 'clone repository':
			return await executeCloneRepository(ctx);
		case 'create new git commit':
			return await executeCreateNewGitCommit(ctx);
		default:
			return ctx.fail('no match');
	}
};

export const gitPlugins = new Set([gitPlugin]);
