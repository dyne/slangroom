// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom, version as coreVersion } from '@slangroom/core';
import { ethereum, version as ethereumVersion } from '@slangroom/ethereum';
import { fs, version as fsVersion } from '@slangroom/fs';
import { git, version as gitVersion } from '@slangroom/git';
import { helpers, version as helpersVersion } from '@slangroom/helpers';
import { http, version as httpVersion } from '@slangroom/http';
import { JSONSchema, version as jsonSchemaVersion } from '@slangroom/json-schema';
import { location, version as locationVersion } from '@slangroom/location';
import { pocketbase, version as pocketbaseVersion } from '@slangroom/pocketbase';
import { qrcode, version as qrcodeVersion } from '@slangroom/qrcode';
import { rdf, version as rdfVersion } from '@slangroom/rdf';
import { timestamp, version as timestampVersion } from '@slangroom/timestamp';
import { zencode, version as zencodeVersion } from '@slangroom/zencode';
import { zenroomVersion } from '@slangroom/deps/zenroom';
import packageJson from '@slangroom/browser/package.json' with { type: 'json' };

// web dependencies
import { Buffer } from 'buffer';

export const version = packageJson.version;

const plugins_dict = {
	ethereum: {
		plugin: ethereum,
		version: ethereumVersion
	},
	fs: {
		plugin: fs,
		version: fsVersion
	},
	git: {
		plugin: git,
		version: gitVersion
	},
	helpers: {
		plugin: helpers,
		version: helpersVersion
	},
	http: {
		plugin: http,
		version: httpVersion
	},
	'json-schema': {
		plugin: JSONSchema,
		version: jsonSchemaVersion
	},
	location: {
		plugin: location,
		version: locationVersion
	},
	pocketbase: {
		plugin: pocketbase,
		version: pocketbaseVersion
	},
	qrcode: {
		plugin: qrcode,
		version: qrcodeVersion
	},
	rdf: {
		plugin: rdf,
		version: rdfVersion
	},
	timestamp: {
		plugin: timestamp,
		version: timestampVersion
	},
	zencode: {
		plugin: zencode,
		version: zencodeVersion
	},
};

let welcome_message = '🎉 Slangroom is ready, installed zenroom and plugins:\n';
welcome_message = welcome_message.concat(` - zenroom@${zenroomVersion}\n`);
welcome_message = welcome_message.concat(` - @slangroom/core@${coreVersion}\n`);

const plugins = [];
for (const [name, dict] of Object.entries(plugins_dict)) {
	plugins.push(dict.plugin);
	welcome_message = welcome_message.concat(` - @slangroom/${name}@${dict.version}\n`);
}

const slangroom = new Slangroom(plugins);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).slangroom = slangroom; // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

window.Buffer = Buffer;

console.log(welcome_message);
