// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"
import { completeFromList } from "@codemirror/autocomplete"

export const SlangroomLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				Application: delimitedIndent({ closing: ")", align: false })
			}),
			foldNodeProp.add({
				Application: foldInside
			}),
			styleTags({
				Identifier: t.variableName,
				WhenStatement: t.variableName,
				ThenStatement: t.bool,
				Rule: t.string,
				StringLitteral: t.string,
				LineComment: t.lineComment
			})
		]
	}),
	languageData: {
		commentTokens: { line: "#" }
	}
})

export const ac = SlangroomLanguage.data.of({
	autocomplete: completeFromList([
		{ label: "given", type: "keyword" },
		{ label: "then", type: "keyword" },
		{ label: "when", type: "keyword" }
	])
})

export function Slangroom() {
	return new LanguageSupport(SlangroomLanguage, [ac])
}
