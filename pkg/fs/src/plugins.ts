import { visit } from '@slangroom/fs/visitor';
import { AfterPlugin } from '@slangroom/core/plugin';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * A directory that is safe to write to and read from.
 *
 * Care must be taken to not allow writes and reads outside of this directory.
 */
export const SandboxDir = '/tmp/slangroom';

export const ThenISaveStringIntoTheFile = new AfterPlugin(async ({ statement, result }) => {
	const ast = visit(statement);
	// TODO: if `visit()` fails, exit (return)

	const filename = result[ast.filename] as string;
	const content = result[ast.content] as string;
	const normalized = path.normalize(filename);
	// "/" and ".." prevents directory traversal
	const does_directory_traversal = normalized.startsWith('/') || normalized.startsWith('..');
	// "." ensures that "foo/bar" or "./foo" is valid, while "." isn't
	// (that is, no "real" filepath is provided)
	const doesnt_provide_file = normalized.startsWith('.');
	if (does_directory_traversal || doesnt_provide_file) return; // TODO: instead of ignoring, do we wanna error out?
	// here onward, we're sure `filepath` is under `SandboxDir`
	const filepath = path.join(SandboxDir, normalized);

	// these following two lines allow subdirs to be created if
	// `normalized` contains any (or `SandboxDir` to be created if it
	// doesn't exist already)
	const dirname = path.dirname(filepath);
	await fs.mkdir(dirname, { recursive: true });

	const fhandle = await fs.open(filepath, 'wx');
	await fhandle.write(content);
});

export const allPlugins = new Set([ThenISaveStringIntoTheFile]);
