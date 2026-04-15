// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import OAuth2Server from '@node-oauth/oauth2-server';
import { Request, Response, type Client } from '@node-oauth/oauth2-server';
import { AuthenticateHandler, InMemoryCache, AuthorizeHandler } from '@slangroom/oauth';
import { Jsonable, JsonableObject } from '@slangroom/shared';
import { JWK } from 'jose';
// read the version from the package.json
import packageJson from '@slangroom/oauth/package.json' with { type: 'json' };

export const version = packageJson.version;

export class OauthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/oauth@' + packageJson.version + ' Error';
	}
}

const p = new Plugin();

/* Parse QueryString using String Splitting */
function parseQueryStringToDictionary(queryString: string) {
	const dictionary: { [key: string]: string } = {};

	// remove the '?' from the beginning of the
	// if it exists
	if (queryString.indexOf('?') === 0) {
		queryString = queryString.substr(1);
	}

	// Step 1: separate out each key/value pair
	const parts = queryString.split('&');

	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		// Step 2: Split Key/Value pair
		const keyValuePair = p!.split('=');

		// Step 3: Add Key/Value pair to Dictionary object
		const key = keyValuePair[0];
		let value = keyValuePair[1];

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
const getInMemoryCache = (
	serverData: { jwk: JWK; url: string },
	options?: JsonableObject,
): InMemoryCache => {
	if (!inMemoryCache) {
		options = Object.assign(
			{
				accessTokenLifetime: 60 * 60, // 1 hour.
				refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
				allowExtendedTokenAttributes: true,
				requireClientAuthentication: {}, // defaults to true for all grant types
			},
			options,
		);
		inMemoryCache = new InMemoryCache(serverData, options);
	}
	return inMemoryCache;
};

let authenticateHandler: AuthenticateHandler | undefined;;
const getAuthenticateHandler = (model: InMemoryCache, authenticationUrl?: string): AuthenticateHandler => {
	if (!authenticateHandler) {
		authenticateHandler = new AuthenticateHandler({ model: model }, authenticationUrl);
	}
	return authenticateHandler;
};

const validRequest = (
	params: Jsonable,
	method: 'GET' | 'POST',
): { ok: true; request: Request } | { ok: false; error: OauthError } => {
	if (!params || typeof params !== 'object' || !('body' in params) || !('headers' in params)) {
		return { ok: false, error: new OauthError('Input request is not valid') };
	}
	const bodyString = params['body'];
	const headers = params['headers'];
	if (typeof bodyString !== 'string') {
		return { ok: false, error: new OauthError('Request body must be a string') };
	}
	const request = new Request({
		body: parseQueryStringToDictionary(bodyString),
		headers,
		method,
		query: {},
	});
	return {
		ok: true,
		request,
	};
};

const validServerData = (
	serverData: Jsonable,
):
	| { ok: true; model: InMemoryCache; authenticationUrl: string | undefined }
	| { ok: false; error: OauthError } => {
	if (inMemoryCache) {
		return {
			ok: true,
			model: inMemoryCache,
			authenticationUrl: (serverData as { authenticationUrl?: string })?.authenticationUrl,
		};
	}
	if (
		!serverData ||
		typeof serverData !== 'object' ||
		!('jwk' in serverData) ||
		!('url' in serverData)
	) {
		return { ok: false, error: new OauthError('Server data is not valid') };
	}
	if (typeof serverData['jwk'] !== 'object' || typeof serverData['url'] !== 'string') {
		return { ok: false, error: new OauthError('Server data parameters types are not valid') };
	}
	if (
		'authentication_url' in serverData &&
		typeof serverData['authentication_url'] !== 'string'
	) {
		return { ok: false, error: new OauthError('Server data parameters types are not valid') };
	}
	return {
		ok: true,
		model: getInMemoryCache(serverData as { jwk: JWK; url: string }),
		authenticationUrl: serverData['authentication_url'],
	};
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
		const validatedRequest = validRequest(ctx.fetch('request'), 'POST');
		if (!validatedRequest.ok) return ctx.fail(validatedRequest.error);
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		const response = new Response();

		const server = new OAuth2Server({ model: validatedServerData.model });
		let res_token;
		try {
			await validatedServerData.model.verifyDpopHeader(validatedRequest.request);
			const token_options = {
				accessTokenLifetime: 60 * 60, // 1 hour.
				refreshTokenLifetime: 60 * 60 * 24 * 14, // 2 weeks.
				allowExtendedTokenAttributes: true,
				requireClientAuthentication: {}, // defaults to true for all grant types
			};
			res_token = await server.token(validatedRequest.request, response, token_options);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}

		const removed = validatedServerData.model.revokeClient(res_token.client);
		if (!removed) return ctx.fail(new OauthError('Failed to revoke Client'));

		validatedServerData.model.revokeAuthorizationDetails(res_token['authorizationCode']);

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
			authorization_details: res_token['authorization_details'],
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
		const validatedRequest = validRequest(ctx.fetch('request'), 'GET');
		if (!validatedRequest.ok) return ctx.fail(validatedRequest.error);
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		try {
			const handler = getAuthenticateHandler(
				validatedServerData.model,
				validatedServerData.authenticationUrl,
			);
			const authorize_options = {
				model: validatedServerData.model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60, // 5 minutes.
			};
			await new AuthorizeHandler(authorize_options).verifyAuthorizeParams(
				validatedRequest.request,
			);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
		return ctx.pass('Given request_uri and client_id are valid');
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
	(ctx) => {
		const validatedRequest = validRequest(ctx.fetch('request'), 'GET');
		if (!validatedRequest.ok) return ctx.fail(validatedRequest.error);
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		const response = new Response();

		try {
			const handler = getAuthenticateHandler(
				validatedServerData.model,
				validatedServerData.authenticationUrl,
			);
			const authorize_options = {
				model: validatedServerData.model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60, // 5 minutes.
			};
			const res_authCode = new AuthorizeHandler(authorize_options).handle(
				validatedRequest.request,
				response,
			);
			return ctx.pass({ code: res_authCode.authorizationCode });
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
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
		const validatedRequest = validRequest(ctx.fetch('request'), 'GET');
		if (!validatedRequest.ok) return ctx.fail(validatedRequest.error);
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		const client = ctx.fetch('client') as Client;
		const expires_in = ctx.fetch('expires_in') as number;

		const response = new Response();

		try {
			const handler = getAuthenticateHandler(
				validatedServerData.model,
				validatedServerData.authenticationUrl,
			);
			validatedServerData.model.setClient(client);
			const authorize_options = {
				model: validatedServerData.model,
				authenticateHandler: handler,
				allowEmptyState: false,
				authorizationCodeLifetime: 5 * 60, // 5 minutes.
			};
			const res = await new AuthorizeHandler(authorize_options).handle_par(
				validatedRequest.request,
				response,
				expires_in,
			);
			return ctx.pass(res);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
	},
);

/**
 * @internal
 */
//Sentence that given an access token return the authorization_details
/**
Given I send token 'token' and send server_data 'server' and get authorization details from token and output into 'claims'
Input:
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
	token: MUST be a string representing a valid access_token
Output:
	claims: string array of the authorization_details linked to the access_token
*/
export const getClaims = p.new(
	['token', 'server_data'],
	'get authorization details from token',
	async (ctx) => {
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);
		const accessToken = ctx.fetch('token') as string;

		try {
			const res = await validatedServerData.model.getAuthDetailsFromToken(accessToken);
			return ctx.pass(res);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
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
	(ctx) => {
		const params = ctx.fetch('data') as JsonableObject;
		const uri = ctx.fetch('request_uri') as string;
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		try {
			const res = validatedServerData.model.updateAuthorizationDetails(uri, params);
			return ctx.pass(res);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
	},
);

/**
 * @internal
 */
// Sentence that given a request_uri return the redirect_uri
/**
Given I send request_uri 'request_uri' and send server_data 'server' and get redirect_uri from request_uri and output into 'redirect_uri'
Input:
	server_data: MUST be a string dictionary with keys
			jwk: JWK containing the public key of the authorization_server
			url: url of the authorization_server
			authentication_url: did resolver for client pk
	request_uri: MUST be a string (output of a /par request)
Output:
	redirect_uri: string
*/
export const getRedirectUri = p.new(
	['request_uri', 'server_data'],
	'get redirect_uri from request_uri',
	async (ctx) => {
		const uri = ctx.fetch('request_uri') as string;
		const validatedServerData = validServerData(ctx.fetch('server_data'));
		if (!validatedServerData.ok) return ctx.fail(validatedServerData.error);

		const rand_uri = uri.split(':').pop();
		if (!rand_uri) {
			return ctx.fail(new OauthError('Invalid request_uri'));
		}
		try {
			const authData = await validatedServerData.model.getAuthCodeFromUri(rand_uri);
			return ctx.pass(authData['redirectUri']);
		} catch (e) {
			return ctx.fail(new OauthError(e.message));
		}
	},
);

export const oauth = p;
