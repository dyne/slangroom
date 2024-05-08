// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { execaCommand } from 'execa'

export class ShellError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/shell Error';
	}
}

const p = new Plugin()

/**
 * @internal
 */
export const runCommand = p.new(['command'], 'execute in shell', async (ctx) => {
    const command = ctx.fetch('command');
    if (typeof command !== 'string') return ctx.fail(new ShellError("the command must be string, including args"));
    try {
        const { stdout } = await execaCommand(command);
        return ctx.pass(stdout);
    } catch (e) {
        return ctx.fail(new ShellError(e.message));
    }
})

export const shell = p


