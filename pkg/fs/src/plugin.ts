// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import * as path from 'node:path';
import * as fspkg from 'node:fs/promises';
import * as os from 'node:os';
import axios from 'axios';
import extractZip from 'extract-zip';

/**
 * @internal
 */
export const sandboxDir = () => {
	// TODO: sanitize sandboxDir
	return process.env['FILES_DIR'];
};

const resolveDirPath = (unsafe: string) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// Unlike `resolveFilepath`, we allow `.` to be used here, obviously.
	if (doesDirectoryTraversal) return { error: `dirpath is unsafe: ${unsafe}` };
	const sandboxdir = sandboxDir();
	if (!sandboxdir) return { error: '$FILES_DIR must be provided' };
	return { dirpath: path.join(sandboxdir, normalized) };
};

const resolveFilepath = (unsafe: string) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// `.` ensures that `foo/bar` or `./foo` is valid, while `.` isn't
	// (that is, no "real" filepath is provided)
	const DoesntProvideFile = normalized.startsWith('.');
	if (doesDirectoryTraversal || DoesntProvideFile)
		return { error: `filepath is unsafe: ${unsafe}` };
	const sandboxdir = sandboxDir();
	if (!sandboxdir) return { error: '$FILES_DIR must be provided' };
	return { filepath: path.join(sandboxdir, normalized) };
};

const readFile = async (safePath: string) => {
	const str = await fspkg.readFile(safePath, 'utf8');
	return str;
};

const readJSON = async (safePath: string) => {
	const str = await fspkg.readFile(safePath, 'utf8');
	return JSON.parse(str);
};

const checkFileExists = async (safePath: string) => {
	try {
		await fspkg.stat(safePath);
	} catch {
		return false;
	}
	return true;
}

const p = new Plugin();

/**
 * @internal
 */
export const downloadAndExtract = p.new(
	'connect',
	['path'],
	'download and extract',
	async (ctx) => {
		const zipUrl = ctx.fetchConnect()[0];
		const unsafe = ctx.fetch('path');
		if (typeof unsafe !== 'string') return ctx.fail('path must be string');

		const { dirpath: dirPath, error } = resolveDirPath(unsafe);
		if (!dirPath) return ctx.fail(error);
		await fspkg.mkdir(dirPath, { recursive: true });

		try {
			const resp = await axios.get(zipUrl, { responseType: 'arraybuffer' });
			const tempdir = await fspkg.mkdtemp(path.join(os.tmpdir(), 'slangroom-'));
			const tempfile = path.join(tempdir, 'downloaded');
			await fspkg.writeFile(tempfile, resp.data);
			await extractZip(tempfile, { dir: dirPath });
			await fspkg.rm(tempdir, { recursive: true });
			return ctx.pass(null);
		} catch (e) {
			if (e instanceof Error) return ctx.fail(e.message);
			return ctx.fail(`unknown error: ${e}`);
		}
	},
);

/**
 * @internal
 */
export const readFileContent = p.new(['path'], 'read file content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);

	return ctx.pass(await readJSON(filepath));
});

/**
 * @internal
 */
export const readVerbatimFileContent = p.new(['path'], 'read verbatim file content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);

	return ctx.pass(await readFile(filepath));
});

/**
 * @internal
 */
export const storeInFile = p.new(['content', 'path'], 'store in file', async (ctx) => {
	// TODO: should `ctx.fetch('content')` return a JsonableObject?
	const content = JSON.stringify(ctx.fetch('content'));
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);

	await fspkg.mkdir(path.dirname(filepath), { recursive: true });
	await fspkg.writeFile(filepath, content);
	return ctx.pass(null);
});

/**
 * @internal
 */
export const listDirectoryContent = p.new(['path'], 'list directory content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { dirpath, error } = resolveDirPath(unsafe);
	if (!dirpath) return ctx.fail(error);

	const filepaths = (await fspkg.readdir(dirpath)).map((f) => path.join(dirpath, f));
	const stats = await Promise.all(filepaths.map((f) => fspkg.stat(f)));
	const result = stats.map((stat, i) => {
		const filepath = filepaths[i] as string;
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
	return ctx.pass(result);
});

/**
 * @internal
 */
export const verifyFileExists = p.new(['path'], 'verify file exists', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);
	if (!(await checkFileExists(filepath))) return ctx.fail('no such file or directory: '+filepath);
	return ctx.pass(null);
});

/**
 * @internal
 */
export const verifyFileDoesNotExist = p.new(['path'], 'verify file does not exist', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);
	if (await checkFileExists(filepath)) return ctx.fail('file or directory found under: '+filepath);
	return ctx.pass(null);
});

export const fs = p;
