// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {ExternalTokenizer} from "@lezer/lr"
import { eof } from "./syntax.grammar.terms"

export const token = new ExternalTokenizer(
	(input) => {
	  if (input.next < 0) {
		input.acceptToken(eof);
	  }
	},
	{ contextual: true, fallback: true }
  );
