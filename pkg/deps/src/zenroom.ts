// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import packageJson from 'zenroom/package.json' with { type: 'json' };

export const zenroomVersion = packageJson.version;
export * from 'zenroom';
