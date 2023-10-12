import type { PluginContext, PluginResult } from '@slangroom/core';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import axios from 'axios';
import extractZip from 'extract-zip';

/**
 * @internal
 */
export const sandboxDir = () => {
	// TODO: sanitize sandboxDir
	const ret = process.env['FILES_DIR'];
	if (!ret) throw new Error('$FILES_DIR must be provided');
	return ret;
};

const resolveDirPath = (unsafe: string) => {
	const normalized = path.normalize(unsafe);
	// `/` and `..` prevent directory traversal
	const doesDirectoryTraversal = normalized.startsWith('/') || normalized.startsWith('..');
	// Unlike `resolveFilepath`, we allow `.` to be used here, obviously.
	if (doesDirectoryTraversal) return { error: `dirpath is unsafe: ${unsafe}` };
	return { dirpath: path.join(sandboxDir(), normalized) };
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
	return { filepath: path.join(sandboxDir(), normalized) };
};

const readFile = async (safePath: string) => {
	const str = await fs.readFile(safePath, 'utf8');
	return JSON.parse(str);
};

/**
 * @internal
 */
export const executeDownloadExtract = async (ctx: PluginContext): Promise<PluginResult> => {
	const zipUrl = ctx.fetchConnect()[0];
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { dirpath: dirPath, error } = resolveDirPath(unsafe);
	if (!dirPath) return ctx.fail(error);
	await fs.mkdir(dirPath, { recursive: true });

	try {
		const resp = await axios.get(zipUrl, { responseType: 'arraybuffer' });
		const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'slangroom-'));
		const tempfile = path.join(tempdir, 'downloaded');
		await fs.writeFile(tempfile, resp.data);
		await extractZip(tempfile, { dir: dirPath });
		await fs.rm(tempdir, { recursive: true });
		return ctx.pass('yes');
	} catch (e) {
		if (e instanceof Error) return ctx.fail(e.message);
		return ctx.fail(`unknown error: ${e}`);
	}
};

/**
 * @internal
 */
export const executeReadFileContent = async (ctx: PluginContext): Promise<PluginResult> => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);

	return ctx.pass(await readFile(unsafe));
};

/**
 * @internal
 */
export const executeStoreInFile = async (ctx: PluginContext): Promise<PluginResult> => {
	// TODO: should `ctx.fetch('content')` return a JsonableObject?
	const content = JSON.stringify(ctx.fetch('content'));
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { filepath, error } = resolveFilepath(unsafe);
	if (!filepath) return ctx.fail(error);

	await fs.mkdir(path.dirname(filepath), { recursive: true });
	await fs.writeFile(filepath, content);

	return ctx.fail('TODO');
};

/**
 * @internal
 */
export const executeListDirectoryContent = async (ctx: PluginContext): Promise<PluginResult> => {
	const unsafe = ctx.fetch('path');
	if (typeof unsafe !== 'string') return ctx.fail('path must be string');

	const { dirpath, error } = resolveDirPath(unsafe);
	if (!dirpath) return ctx.fail(error);

	const filepaths = (await fs.readdir(dirpath)).map((f) => path.join(dirpath, f));
	const stats = await Promise.all(filepaths.map((f) => fs.stat(f)));
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
};

const fsPlugin = async (ctx: PluginContext): Promise<PluginResult> => {
	switch (ctx.phrase) {
		case 'download extract':
			return await executeDownloadExtract(ctx);
		case 'read file content':
			return await executeReadFileContent(ctx);
		case 'store in file':
			return await executeStoreInFile(ctx);
		case 'list directory content':
			return await executeListDirectoryContent(ctx);
		default:
			return ctx.fail('no match')
	}
};

export const fsPlugins = new Set([fsPlugin]);
