// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parser } from './syntax.grammar';
import {
	LRLanguage,
	LanguageSupport,
	HighlightStyle,
	syntaxHighlighting,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { completeStatement } from './complete';

export { customLinter } from './lint';

const syntax_colors = syntaxHighlighting(
	HighlightStyle.define(
		[
			{ tag: t.heading, color: 'purple' },
			{ tag: t.heading1, color: 'gray' },
			{ tag: t.variableName, color: 'red' },
			{ tag: t.keyword, color: 'green' },
			{ tag: t.string, color: 'blue' },
			{ tag: t.lineComment, color: 'gray' },
			{ tag: t.heading2, color: 'black' },
		],
		{ all: { color: 'black' } },
	),
);

export const SlangroomLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			styleTags({
				'given then when and in inside if endif foreach endforeach': t.variableName,
				'have send open connect print output': t.keyword,
				'rule VersionRule! GenericRule!': t.heading,
				'scenario ScenarioType/... ScenarioComment!': t.heading1,
				'Action!': t.heading2,
				StringLiteral: t.string,
				Comment: t.lineComment,
			}),
		],
	}),
	languageData: {
		commentTokens: { line: '#' },
	},
});

const ac = SlangroomLanguage.data.of({
	autocomplete: completeStatement,
});

export function Slangroom() {
	return new LanguageSupport(SlangroomLanguage, [syntax_colors, ac]);
};
