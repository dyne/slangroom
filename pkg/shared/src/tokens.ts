// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Lexer, createToken } from '@slangroom/deps/chevrotain';

/**
 * Whitespace of any kind (blanks, tabs, and newlines).
 */
export const Whitespace = createToken({
	name: 'Whitespace',
	pattern: /\s+/,
	group: Lexer.SKIPPED,
});

/**
 * Shell-like comments using '#' to mark what's after it as comments.
 *
 * Spans across the entire line, as expected.
 */
export const Comment = createToken({
	name: 'Comment',
	pattern: /#[^\n\r]*/,
	group: 'comments',
});
