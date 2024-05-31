// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import OAuth2Server from '@node-oauth/oauth2-server';
import { Request, Response } from '@node-oauth/oauth2-server';
import { AuthenticateHandler, InMemoryCache, AuthorizeHandler } from '@slangroom/oauth';
import { JsonableObject } from '@slangroom/shared';
import { JWK } from 'jose';
// read the version from the package.json
import packageJson from '@slangroom/oauth/package.json' with { type: 'json' };

export class OauthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/oauth@' + packageJson.version + ' Error';
	}
}

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
/**
Given I send request 'request' and send server_data 'server' and generate access token and output into 'accessToken_jwt'
Input:
	request: MUST be a string dictionary with keys `header` and `body` of a request to the /token endpoint
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
Output:
	accessToken_jwt: string dictionary containing the access token JWT
*/
export const createToken = p.new(
	['request', 'server_data'],
	'generate access token',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail(new OauthError("Input request is not valid"));
		if (typeof body !== 'string') return ctx.fail(new OauthError("Request body must be a string"));
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail(new OauthError("Server data is missing some parameters"));
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
			return ctx.fail(new OauthError(e.message));
		}

		const removed = model.revokeClient(res_token.client);
		if (!removed) return ctx.fail(new OauthError("Failed to revoke Client"));

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
// Sentence that allows to verify the parameters (request_uri and client_id) of an /authorize request
/**
Given I send request 'request' and send server_data 'server' and verify request parameters
Input:
	request: MUST be a string dictionary with keys `header` and `body` of a request to the /authorize endpoint
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
*/
export const verifyRequestUri = p.new(
	['request', 'server_data'],
	'verify request parameters',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail(new OauthError("Input request is not valid"));
		if (typeof body !== 'string') return ctx.fail(new OauthError("Request body must be a string"));
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail(new OauthError("Server data is missing some parameters"));

		const request = new Request({
			body: parseQueryStringToDictionary(body),
			headers: headers,
			method: 'GET',
			query: {},
		});

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);
		try {
			const handler = getAuthenticateHandler(model, serverData.authenticationUrl);
			const authorize_options = {
				model: model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60   // 5 minutes.
			}
			await new AuthorizeHandler(authorize_options).verifyAuthorizeParams(request);
		} catch(e) {
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass("Given request_uri and client_id are valid");
	},
);

/**
 * @internal
 */
// Sentence that allows to generate and output a valid authorization code for an authenticated request
/**
Given I send request 'request' and send server_data 'server' and generate authorization code and output into 'authCode'
Input:
	request: MUST be a string dictionary with keys `header` and `body` of a request to the /authorize endpoint
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
Output:
	authCode: string dictionary {code: 'authorization_code'}
*/
export const createAuthorizationCode = p.new(
	['request', 'server_data'],
	'generate authorization code',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail(new OauthError("Input request is not valid"));
		if (typeof body !== 'string') return ctx.fail(new OauthError("Request body must be a string"));
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail(new OauthError("Server data is missing some parameters"));

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
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass({ code: res_authCode.authorizationCode });
	},
);

/**
 * @internal
 */
//Sentence that perform a Pushed Authorization Request and return a valid request_uri (and expires_in)
/**
Given I send request 'request' and send client 'client' and send server_data 'server' and send expires_in 'expires_in' and generate request uri and output into 'request_uri_out'
Input:
	request: MUST be a string dictionary with keys `header` and `body` of a request to the /par endpoint
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
	client: string dictionary

Output:
	request_uri_out: string dictionary with keys
			request_uri: string
			expires_in: number
*/
export const createRequestUri = p.new(
	['request', 'client', 'server_data', 'expires_in'],
	'generate request uri',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if (!body || !headers) return ctx.fail(new OauthError("Input request is not valid"));
		if (typeof body !== 'string') return ctx.fail(new OauthError("Request body must be a string"));
		const client = ctx.fetch('client') as JsonableObject;
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail(new OauthError("Server data is missing some parameters"));
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
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass(res);
	},
);


/**
 * @internal
 */
//Sentence that given an access token return the authorization_details
/**
Given I send token 'token' and send server_data 'server' and get claims from token and output into 'claims'
Input:
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
	token: MUST be a string representing a valid access_token
Output:
	claims: string array of the authorization_details linked to the access_token (without `locations` and `credentail_configuration_id`)
*/
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
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass(res);
	},
);

/**
 * @internal
 */
// Sentence that allows to add a string dict(?) to the authorization_details binded to the given request_uri
/**
Given I send request_uri 'request_uri' and send data 'data' and send server_data 'server' and add data to authorization details and output into 'auth_details'
Input:
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
	request_uri: MUST be a string (output of a /par request)
Output:
	auth_details: (optional) string dictionary of the authorization_details linked to the request_uri
*/
export const changeAuthDetails = p.new(
	['request_uri', 'data', 'server_data'],
	'add data to authorization details',
	async (ctx) => {
		const params = ctx.fetch('data') as JsonableObject;
		const uri = ctx.fetch('request_uri') as string;
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string, authenticationUrl: string };
		if (!serverData['jwk'] || !serverData['url']) return ctx.fail(new OauthError("Server data is missing some parameters"));

		const options = {
			accessTokenLifetime: 60 * 60, // 1 hour.
			refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
			allowExtendedTokenAttributes: true,
			requireClientAuthentication: {}, // defaults to true for all grant types
		};

		const model = getInMemoryCache(serverData, options);
		let res
		try {
			res = await model.updateAuthorizationDetails(uri, params);
		} catch(e) {
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass(res);
	},
);


export const oauth = p;
