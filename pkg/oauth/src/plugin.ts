// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import OAuth2Server from '@node-oauth/oauth2-server';
import { Request, Response } from '@node-oauth/oauth2-server';
import { AuthenticateHandler, InMemoryCache, AuthorizeHandler } from '@slangroom/oauth';
import { JsonableObject } from '@slangroom/shared';
import { JWK } from 'jose';

const p = new Plugin();

/* Parse QueryString using String Splitting */
function parseQueryStringToDictionary(queryString: string) {
	var dictionary: { [key: string]: string } = {};

	// remove the '?' from the beginning of the
	// if it exists
	if (queryString.indexOf('?') === 0) {
		queryString = queryString.substr(1);
	}

	// Step 1: separate out each key/value pair
	var parts = queryString.split('&');

	for (var i = 0; i < parts.length; i++) {
		var p = parts[i];
		// Step 2: Split Key/Value pair
		var keyValuePair = p!.split('=');

		// Step 3: Add Key/Value pair to Dictionary object
		var key = keyValuePair[0];
		var value = keyValuePair[1];

		// decode URI encoded string
		value = decodeURIComponent(value!);
		value = value.replace(/\+/g, ' ');
		if (key != undefined) {
			dictionary[key] = value;
		}
	}

	// Step 4: Return Dictionary Object
	return dictionary;
}

let inMemoryCache: InMemoryCache | null = null;
const getInMemoryCache = (serverData: { jwk: JWK, url: string }, options?: JsonableObject): InMemoryCache => {
	if (!inMemoryCache) {
		inMemoryCache = new InMemoryCache(serverData, options);
	}
	return inMemoryCache;
};

let authenticateHandler: any;
const getAuthenticateHandler = (model: InMemoryCache, authenticationUrl: string): any => {
	if (!authenticateHandler) {
		authenticateHandler = new AuthenticateHandler({ model: model }, authenticationUrl);
	}
	return authenticateHandler;
};

/**
 * @internal
 */

//Sentence that allows to generate and output a valid access token from an auth server backend
export const createToken = p.new(
	['request', 'server_data'],
	'generate access token',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail("Input request is not valid");
		if (typeof body !== 'string') return ctx.fail("Request body must be a string");
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail("Server data is missing some parameters");
		const bodyDict = parseQueryStringToDictionary(body);
		const request = new Request({
			body: bodyDict,
			headers: headers,
			method: 'POST',
			query: {},
		});

		const response = new Response();

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);
		let res_token
		try {
			const handler = getAuthenticateHandler(model, serverData.authenticationUrl);
			const server = new OAuth2Server({
				model: model,
				authenticateHandler: handler,
			});
			await model.verifyDpopHeader(request);
			res_token = await server.token(request, response, options);
		} catch(e) {
			return ctx.fail(e);
		}

		const removed = model.revokeClient(res_token.client);
		if (!removed) return ctx.fail("Failed to revoke Client");

		model.revokeAuthorizationDetails(res_token['authorizationCode']);

		//we remove the client and user object from the token
		const token: JsonableObject = {
			accessToken: res_token.accessToken,
			accessTokenExpiresAt: Math.round(res_token.accessTokenExpiresAt!.getTime() / 1000),
			authorizationCode: res_token['authorizationCode'],
			c_nonce: res_token['c_nonce'],
			c_nonce_expires_in: res_token['c_nonce_expires_in'],
			jkt: res_token['jkt'],
			refreshToken: res_token.refreshToken!,
			refreshTokenExpiresAt: Math.round(res_token.refreshTokenExpiresAt!.getTime() / 1000),
			scope: res_token.scope!,
			resource: res_token['resource'],
			authorization_details: res_token['authorization_details']
		};

		return ctx.pass(token);
	},
);

/**
 * @internal
 */
// Sentence that allows to generate and output a valid authorization code for an authenticated request
export const createAuthorizationCode = p.new(
	['request', 'server_data'],
	'generate authorization code',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail("Input request is not valid");
		if (typeof body !== 'string') return ctx.fail("Request body must be a string");
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail("Server data is missing some parameters");

		const request = new Request({
			body: parseQueryStringToDictionary(body),
			headers: headers,
			method: 'GET',
			query: {},
		});

		const response = new Response();

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);
		let res_authCode
		try {
			const handler = getAuthenticateHandler(model, serverData.authenticationUrl);
			const authorize_options = {
				model: model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60   // 5 minutes.
			}
			res_authCode = await new AuthorizeHandler(authorize_options).handle(request, response);
		} catch(e) {
			return ctx.fail(e);
		}
		return ctx.pass({ code: res_authCode.authorizationCode });
	},
);

/**
 * @internal
 */
//Sentence that perform a Pushed Authorization Request and return a valid request_uri (and expires_in)
export const createRequestUri = p.new(
	['request', 'client', 'server_data', 'expires_in'],
	'generate request uri',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail("Input request is not valid");
		if (typeof body !== 'string') return ctx.fail("Request body must be a string");
		const client = ctx.fetch('client') as JsonableObject;
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail("Server data is missing some parameters");
		const expires_in = ctx.fetch('expires_in') as number;

		const request = new Request({
			body: parseQueryStringToDictionary(body),
			headers: headers,
			method: 'GET',
			query: {},
		});

		const response = new Response();

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);
		let res
		try {
			const handler = getAuthenticateHandler(model, serverData.authenticationUrl);
			await model.setClient(client);
			const authorize_options = {
				model: model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60   // 5 minutes.
			}
			res = await new AuthorizeHandler(authorize_options).handle_par(request, response, expires_in);
		} catch(e) {
			return ctx.fail(e);
		}
		return ctx.pass(res);
	},
);


/**
 * @internal
 */
//Sentence that given an access token return the authorization_details
export const getClaims = p.new(
	['token', 'server_data'],
	'get claims from token',
	async (ctx) => {
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		const accessToken = ctx.fetch('token') as string;

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);

		let res
		try {
			res = await model.getClaimsFromToken(accessToken);
		} catch(e) {
			return ctx.fail(e);
		}
		return ctx.pass(res);
	},
);

export const oauth = p;
