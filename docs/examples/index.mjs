// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
let examplesDoc = `\n# Slangroom examples\n\n`;

[
	'db',
	'ethereum',
	'fs',
	'git',
	'helpers',
	'http',
	'json-schema',
	'oauth',
	'pocketbase',
	'qrcode',
	'redis',
	'shell',
	'timestamp',
	'zencode'
].map((pluginName) => {
	examplesDoc = examplesDoc.concat(`## ${pluginName} plugin examples\n\n`)
	const dir = path.resolve(__dirname, `../../examples/${pluginName}`);
	const files = fs.readdirSync(dir);
	files.map((file) => {
		const baseName = file.split('.')[0];
		const ext = file.split('.')[1];
		if (ext === 'meta') {
			const meta = fs.readFileSync(path.resolve(__dirname, `../../examples/${pluginName}/${file}`));
			const metaJson = JSON.parse(meta);
			examplesDoc = examplesDoc.concat(`### ${metaJson.title}\n`)
			examplesDoc = examplesDoc.concat(`::: code-group
<<< @/../examples/${pluginName}/${baseName}.slang{${metaJson.highlight} gherkin:line-numbers}
<<< @/../examples/${pluginName}/${baseName}.data.json{json}
<<< @/../examples/${pluginName}/${baseName}.keys.json{json}
:::\n\n`)
			return;
		}
	});
	return;
})

fs.writeFileSync(path.resolve(__dirname, 'index.md'), examplesDoc)
