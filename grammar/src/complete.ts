// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CompletionContext, snippetCompletion } from "@codemirror/autocomplete";

// Helper function to strip quotes from matched strings
function stripQuotes(s: string) {
  return s.replace(/^'|'$/g, "");
}

const fullStatementTemplates = [
  snippetCompletion("Given I connect to '${1:}' and send object '${2:}' and send headers '${3:}' and do post and output into '${4:}'", { label: "Given I connect to ' ' and send object ' ' and send headers ' ' and do post and output into ' '", type: "keyword" }),
  snippetCompletion("Given I connect to '${1:}' and send record '${2:}' and send table '${3:}' and read the record of the table and output into '${4:}'", { label: "Given I connect to ' ' and send record ' ' and send table ' ' and read the record of the table and output into ' '", type: "keyword" })
];

export function completeGivenStatement(context: CompletionContext) {
  let line = context.state.doc.lineAt(context.pos);
  let textBefore = context.state.sliceDoc(line.from, context.pos);
  let triggerMatch = /G.*$/.exec(textBefore);

  if (triggerMatch) {
    let strings = textBefore.match(/'([^']*)'/g);

    if (!strings) {
      return {
        from: context.pos - triggerMatch[0].length,
        options: fullStatementTemplates,
        validFor: /^.*$/,
      };
    }

    let strippedStrings = strings.map(stripQuotes);

    let templateOption = [
      snippetCompletion(
        `Given I connect to '\${1:${strippedStrings[0] || ""}}' and send object '\${2:${strippedStrings[1] || ""}}' and send headers '\${3:${strippedStrings[2] || ""}}' and do post and output into '\${4:${strippedStrings[3] || ""}}'`,
        {
          label: `Given I connect to ${strings[0] || "''"} and send object ${strings[1] || "''"} and send headers ${strings[2] || "''"} and do post and output into ${strings[3] || "''"}`,
          type: "keyword"
        }
      ),
      snippetCompletion(
        `Given I connect to '\${1:${strippedStrings[0] || ""}}' and send record '\${2:${strippedStrings[1] || ""}}' and send table '\${3:${strippedStrings[2] || ""}}' and read the record of the table and output into '\${4:${strippedStrings[3] || ""}}'`,
        {
          label: `Given I connect to ${strings[0] || "''"} and send record ${strings[1] || "''"} and send table ${strings[2] || "''"} and read the record of the table and output into ${strings[3] || "''"}`,
          type: "keyword"
        }
      )
    ];

    return {
      from: context.pos - textBefore.length,
      options: templateOption,
      validFor: /^.*$/,
    };
  }

  return null;
}
