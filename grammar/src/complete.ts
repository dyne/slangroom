// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CompletionContext, snippetCompletion } from "@codemirror/autocomplete";
import { fullStatementTemplates } from "./complete_statement";

// Helper function to strip quotes from matched strings
function stripQuotes(s: string) {
  return s.replace(/^'|'$/g, "");
}

const fullStatementSnippets = fullStatementTemplates.map((x) => {
	let n = 1;
	return snippetCompletion(x.label.replace(/''/g, () => `'\${${n++}:}'`), x);
});

export function completeGivenStatement(context: CompletionContext) {
  const line = context.state.doc.lineAt(context.pos);
  let textBefore = context.state.sliceDoc(line.from, context.pos);
  const triggerMatch = /G.*$/i.exec(textBefore);

  if (triggerMatch) {
    const strings = textBefore.match(/'([^']*)'/g);
	textBefore = textBefore.toLowerCase()
    if (!strings) {
      return {
        from: context.pos - triggerMatch[0].length,
        options: fullStatementSnippets,
        validFor: /^.*$/,
      };
    }

    const strippedStrings = strings.map(stripQuotes);

	const templateOption = fullStatementTemplates.map((x) => {
		let n = 1;
		let m = 0;
		return snippetCompletion(
			x.label.replace(/''/g, () => `\${${n}:${strippedStrings[n++-1] || ""}}`),
			{
				label: x.label.replace(/''/g, () => `${strings[m++] || "''"}`),
				type: x.type
			});
	})

    return {
      from: context.pos - textBefore.length,
      options: templateOption,
      validFor: /^.*$/,
    };
  }

  return null;
}