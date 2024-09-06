// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, HighlightStyle, syntaxHighlighting } from "@codemirror/language"
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
		{tag: t.lineComment, color: "gray"},
		{tag: t.heading2, color: "black"}
	  ],
	  { all: { color: "black" } }
	)
  );
export const SlangroomLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			styleTags({
				"Given Then When and in inside If EndIf Foreach EndForeach" : t.variableName,
				"have send open connect print output" : t.keyword,
				"Rule VersionRule! UnknownIgnoreRule! GenericRule!": t.heading,
				" Scenario ScenarioType/... ScenarioComment!": t.heading1,
				"DbAction! EthereumAction! FsAction! GitAction! HelpersAction! HttpAction! JsonSchemaAction! OAuthAction! PocketbaseAction! QrCodeAction! RedisAction! ShellAction! TimestampAction! WalletAction! ZencodeAction!": t.heading2,
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
