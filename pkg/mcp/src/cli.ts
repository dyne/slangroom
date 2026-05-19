#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { startStdioServer } from './server.js';

try {
	await startStdioServer();
} catch (error) {
	console.error(error);
	process.exitCode = 1;
}
