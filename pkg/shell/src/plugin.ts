// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import { execaCommand } from 'execa'

const p = new Plugin()

/**
 * @internal
 */
export const runCommand = p.new(['command'], 'execute in shell', async (ctx) => {
    const command = ctx.fetch('command')
    if (typeof command !== 'string') return ctx.fail("the command must be string, including args")
    try {
        const { stdout } = await execaCommand(command);
        return ctx.pass(stdout)
    } catch (e) {
        return ctx.fail(e)
    }
})

export const shell = p


