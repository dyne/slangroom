// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom, version as coreVersion } from '@slangroom/core';
import { qrcode, version as qrcodeVersion } from '@slangroom/qrcode';
import { http, version as httpVersion } from '@slangroom/http';
import { pocketbase, version as pocketbaseVersion } from '@slangroom/pocketbase';
import { helpers, version as helpersVersion } from '@slangroom/helpers';
import { JSONSchema, version as jsonSchemaVersion } from '@slangroom/json-schema';
import { location, version as locationVersion } from '@slangroom/location';
import { zenroomVersion } from '@slangroom/deps/zenroom';
import packageJson from '@slangroom/browser/package.json' with { type: 'json' };

export const version = packageJson.version;

const plugins_dict = {
	http: {
		plugin: http,
		version: httpVersion
	},
	qrcode: {
		plugin: qrcode,
		version: qrcodeVersion
	},
	pocketbase: {
		plugin: pocketbase,
		version: pocketbaseVersion
	},
	helpers: {
		plugin: helpers,
		version: helpersVersion
	},
	'json-schema': {
		plugin: JSONSchema,
		version: jsonSchemaVersion
	},
	location: {
		plugin: location,
		version: locationVersion
	}
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

console.log(welcome_message);
