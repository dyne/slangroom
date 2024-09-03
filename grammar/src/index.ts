// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { completeFromList } from "@codemirror/autocomplete"

const syntax_colors = syntaxHighlighting(
	HighlightStyle.define(
	  [
		{ tag: t.heading, color: "purple" },
		{ tag: t.heading1, color: "gray" },
		{tag: t.variableName, color: "red"},
		{ tag: t.keyword, color: "green" },
		{tag: t.string, color: "blue"},
		{tag: t.lineComment, color: "gray"}
	  ],
	  { all: { color: "black" } }
	)
  );
export const SlangroomLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			styleTags({
				"Given Then When and" : t.variableName,
				"have send open connect print output" : t.keyword,
				"RuleStatement!": t.heading,
				"ScenarioStatement!": t.heading1,
				StringLiteral: t.string,
				Comment: t.lineComment,
			})
		]
	}),
	languageData: {
		commentTokens: { line: "#" }
	}
})

const ac = SlangroomLanguage.data.of({
	autocomplete: completeFromList([
		{ label: "given", type: "keyword" },
		{ label: "then", type: "keyword" },
		{ label: "when", type: "keyword" }
	])
})

export function Slangroom() {
	return new LanguageSupport(SlangroomLanguage, [syntax_colors, ac])
}
