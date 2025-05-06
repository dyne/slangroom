// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { JsonableObject } from '@slangroom/shared';
import * as path from 'path';
import { promises as fspkg } from 'fs';
import axios from 'axios';
import { unzipSync } from 'fflate';
import packageJson from '@slangroom/fs/package.json' with { type: 'json' };

export const version = packageJson.version;

export class FsError extends Error {
    constructor(e: string) {
        super(e)
        this.name = 'Slangroom @slangroom/fs@' + packageJson.version + ' Error'
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

const resolveDirPath = (unsafe: string): ({ok: true, dirpath: string} | {ok: false, error: string}) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// Unlike `resolveFilepath`, we allow `.` to be used here, obviously.
	if (doesDirectoryTraversal) return { ok: false, error: `dirpath is unsafe: ${unsafe}` };
	const sandboxdir = sandboxDir();
	if (!sandboxdir) return { ok: false, error: '$FILES_DIR must be provided' };
	return { ok: true, dirpath: path.join(sandboxdir, normalized) };
};

const resolveFilepath = (unsafe: string): ({ok: true, filepath: string} | {ok: false, error: string}) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// `.` ensures that `foo/bar` or `./foo` is valid, while `.` isn't
	// (that is, no "real" filepath is provided)
	const DoesntProvideFile = normalized.startsWith('.');
	if (doesDirectoryTraversal || DoesntProvideFile)
		return { ok: false, error: `filepath is unsafe: ${unsafe}` };
	const sandboxdir = sandboxDir();
	if (!sandboxdir) return { ok: false, error: '$FILES_DIR must be provided' };
	return { ok: true, filepath: path.join(sandboxdir, normalized) };
};

const readFile = async (safePath: string): Promise<{ok: true, value: string} | {ok: false, error: string}> => {
	try {
		return {ok: true, value: await fspkg.readFile(safePath, 'utf8')};
	} catch(e) {
		return {ok: false, error: e.message};
	}
};

const readJSON = async (safePath: string): Promise<{ok: true, value: JsonableObject} | {ok: false, error: string}> => {
	try {
		const str = await fspkg.readFile(safePath, 'utf8');
		return {ok: true, value: JSON.parse(str)};
	} catch (e) {
		return {ok: false, error: e.message};
	}
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
		if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

		const res = resolveDirPath(unsafe);
		if (!res.ok) return ctx.fail(new FsError(res.error));
		await fspkg.mkdir(res.dirpath, { recursive: true });

		try {
			const resp = await axios.get(zipUrl, { responseType: 'arraybuffer' });
			const zipData = new Uint8Array(resp.data);
			const files = unzipSync(zipData);
			for (const [filename, fileData] of Object.entries(files)) {
				if (filename.endsWith('/')) continue; // skip directories
				const fullPath = path.join(res.dirpath, filename);
				const dir = path.dirname(fullPath);
				console.log('dir', dir);
				console.log('fullPath', fullPath);
				await fspkg.mkdir(dir, { recursive: true });
				await fspkg.writeFile(fullPath, fileData);
			}
			return ctx.pass(null);
		} catch (e) {
			if (e instanceof Error) return ctx.fail(new FsError(e.message));
			return ctx.fail(new FsError(`unknown error: ${e}`));
		}
	},
);

/**
 * @internal
 */
export const readFileContent = p.new(['path'], 'read file content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveFilepath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));

	const cont = await readJSON(res.filepath);
	if (!cont.ok) return ctx.fail(new FsError(cont.error));
	return ctx.pass(cont.value);
});

/**
 * @internal
 */
export const readVerbatimFileContent = p.new(['path'], 'read verbatim file content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveFilepath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));
	const cont = await readFile(res.filepath)
	if (!cont.ok) return ctx.fail(new FsError(cont.error));
	return ctx.pass(cont.value);
});

/**
 * @internal
 */
export const storeInFile = p.new(['content', 'path'], 'store in file', async (ctx) => {
	// TODO: should `ctx.fetch('content')` return a JsonableObject?
	const content = JSON.stringify(ctx.fetch('content'));
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveFilepath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));

	try {
		await fspkg.mkdir(path.dirname(res.filepath), { recursive: true });
		await fspkg.writeFile(res.filepath, content);
	} catch (e) {
		return ctx.fail(new FsError(e.message));
	}

	return ctx.pass(null);
});

/**
 * @internal
 */
export const listDirectoryContent = p.new(['path'], 'list directory content', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveDirPath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));

	const filepaths = (await fspkg.readdir(res.dirpath)).map((f) => path.join(res.dirpath, f));
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
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveFilepath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));
	if (!(await checkFileExists(res.filepath))) return ctx.fail(new FsError('no such file or directory: '+res.filepath));
	return ctx.pass(null);
});

/**
 * @internal
 */
export const verifyFileDoesNotExist = p.new(['path'], 'verify file does not exist', async (ctx) => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail(new FsError('path must be string'));

	const res = resolveFilepath(unsafe);
	if (!res.ok) return ctx.fail(new FsError(res.error));
	if (await checkFileExists(res.filepath)) return ctx.fail(new FsError('file or directory found under: '+res.filepath));
	return ctx.pass(null);
});

export const fs = p;
