// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Typescript of the code below
//https://github.com/node-oauth/node-oauth2-server/blob/master/lib/pkce/pkce.js

import { createHash } from "crypto";

const codeChallengeRegexp = /^([a-zA-Z0-9.\-_~]){43,128}$/;

export const pkce = {

	/**
	 * Return hash for code-challenge method-type.
	 *
	 * @param method {String} the code challenge method
	 * @param verifier {String} the code_verifier
	 * @return {String|undefined}
	 */
	getHashForCodeChallenge(dict:{ method:string, verifier:string }): string | undefined {
		// to prevent undesired side-effects when passing some wird values
		// to createHash or base64URLEncode we first check if the values are right
		if (this.isValidMethod(dict.method) && typeof dict.verifier === 'string' && dict.verifier.length > 0) {
			if (dict.method === 'plain') {
				return dict.verifier;
			}

			if (dict.method === 'S256') {
				const hash = createHash('SHA256').update(dict.verifier).digest();
				return hash.toString('base64url');
			}
		}
		return undefined;
	},

	/**
	 * Check if the request is a PCKE request. We assume PKCE if grant type is
	 * 'authorization_code' and code verifier is present.
	 *
	 * @param grantType {String}
	 * @param codeVerifier {String}
	 * @return {boolean}
	 */
	isPKCERequest(dict:{ grantType:string, codeVerifier:string }): boolean {
		return dict.grantType === 'authorization_code' && !!dict.codeVerifier;
	},

	/**
	 * Matches a code verifier (or code challenge) against the following criteria:
	 *
	 * code-verifier = 43*128unreserved
	 * unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
	 * ALPHA = %x41-5A / %x61-7A
	 * DIGIT = %x30-39
	 *
	 * @see: https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
	 * @param codeChallenge {String}
	 * @return {Boolean}
	 */
	codeChallengeMatchesABNF(codeChallenge: string): boolean {
		return typeof codeChallenge === 'string' &&
			!!codeChallenge.match(codeChallengeRegexp);
	},

	/**
	 * Checks if the code challenge method is one of the supported methods
	 * 'sha256' or 'plain'
	 *
	 * @param method {String}
	 * @return {boolean}
	 */
	isValidMethod(method:string): boolean {
		return method === 'S256' || method === 'plain';
	}
}
