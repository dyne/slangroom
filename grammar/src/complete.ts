// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CompletionContext } from "@codemirror/autocomplete";

const fullStatementTemplates = [
	{ label: "Given I connect to ' ' and send object ' ' and send headers ' ' and do post and output into ' '", type: "keyword" },
	{ label: "Given I connect to ' ' and send record ' ' and send table ' ' and read the record of the table and output into ' '", type: "keyword" }
];

 export  function completeGivenStatement(context: CompletionContext) {

	let line = context.state.doc.lineAt(context.pos);

	let textBefore = context.state.sliceDoc( line.from, context.pos);

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

	  let templateOption = [
		{label: "Given I connect to " + (strings[0] || "''") + " and send object " + (strings[1] || "''") + " and send headers " + (strings[2] || "''") + " and do post and output into " + (strings[3] || "''"), type: "template"},
		{label: "Given I connect to "+ (strings[0] || "''") + " and send record "  + (strings[1] || "''") + " and send table  " + (strings[2] || "''") + " and read the record of the table and output into " + (strings[3] || "''"), type: "template"},
	];

	  return {
		from: context.pos - textBefore.length,
		options: templateOption,
		validFor: /^.*$/,
	  };
	}

	return null;
  }

