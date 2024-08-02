// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import packageJson from '@slangroom/timestamp/package.json' with { type: 'json' };

export const version = packageJson.version;

const p = new Plugin();

export const milliseconds = p.new('fetch the local timestamp in milliseconds', async (ctx) => {
	const t = Date.now();
	return ctx.pass(t.toString());
});

export const seconds = p.new('fetch the local timestamp in seconds', async (ctx) => {
	const t = Math.floor(Date.now() / 1000);
	return ctx.pass(t.toString());
});

export const timestamp = p;
