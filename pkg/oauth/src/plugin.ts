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
		inMemoryCache = new InMemoryCache( serverData, options);
	}
	return inMemoryCache;
};

let authenticateHandler: any;
const getAuthenticateHandler = (model: InMemoryCache, authenticationUrl:string): any => {
	if (!authenticateHandler) {
		authenticateHandler = new AuthenticateHandler({ model: model },  authenticationUrl);
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
		if(!body || !headers) throw Error("Input request is not valid");
		if(typeof body !== 'string') throw Error("Request body must be a string");
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string , authenticationUrl: string };
		if(!serverData['jwk'] || !serverData['url']) throw Error("Server data is missing some parameters");
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
		const handler = getAuthenticateHandler(model, serverData.authenticationUrl);
		var server = new OAuth2Server({
			model: model,
			authenticateHandler: handler,
		});

		const checkDpop = await model.verifyDpopHeader(request);
		if(!checkDpop) throw new Error("Failed to verify DPoP in headers");

		const res_token = await server.token(request, response, options);

		const removed = model.revokeClient(res_token.client);
		if(!removed) throw Error("Failed to revoke Client");

		//we remove the client and user object from the token
		const token: JsonableObject = {
			accessToken: res_token.accessToken,
			accessTokenExpiresAt: Math.round(res_token.accessTokenExpiresAt!.getTime()/ 1000),
			authorizationCode: res_token['authorizationCode'],
			c_nonce: res_token['c_nonce'],
			c_nonce_expires_in: res_token['c_nonce_expires_in'],
			jkt: res_token['jkt'],
			refreshToken: res_token.refreshToken!,
			refreshTokenExpiresAt: Math.round(res_token.refreshTokenExpiresAt!.getTime()/ 1000),
			scope: res_token.scope!,
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
		if(!body || !headers) throw Error("Input request is not valid");
		if(typeof body !== 'string') throw Error("Request body must be a string");
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string , authenticationUrl: string };
		if(!serverData['jwk'] || !serverData['url']) throw Error("Server data is missing some parameters");

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
		const handler = getAuthenticateHandler(model, serverData.authenticationUrl);

		const authorize_options = {
			model: model,
			authenticateHandler: handler,
			allowEmptyState: false,
			authorizationCodeLifetime: 5 * 60   // 5 minutes.
		}
		const res_authCode = await new AuthorizeHandler(authorize_options).handle(request, response);

		const authCode : JsonableObject = {
			authorizationCode: res_authCode.authorizationCode,
			client: res_authCode.client,
			expiresAt: Math.round(res_authCode.expiresAt.getTime()/ 1000),
			redirectUri: res_authCode.redirectUri,
			user: res_authCode.user
		}
		if(res_authCode.codeChallenge) authCode['codeChallenge'] = res_authCode.codeChallenge;
		if(res_authCode.codeChallengeMethod) authCode['codeChallengeMethod'] = res_authCode.codeChallengeMethod;
		if(res_authCode.scope) authCode['scope'] = res_authCode.scope;
		if(res_authCode['resource']) authCode['resource'] = res_authCode['resource'];

		return ctx.pass(authCode);
	},
);

/**
 * @internal
 */
//Sentence that perform a Pushed Authorization Request and return a valid request_uri (and expires_in)
export const createRequestUri = p.new(
	['request', 'client', 'server_data'],
	'generate request uri',
	async (ctx) => {
		const params = ctx.fetch('request') as JsonableObject;
		const body = params['body'];
		const headers = params['headers'];
		if(!body || !headers) throw Error("Input request is not valid");
		if(typeof body !== 'string') throw Error("Request body must be a string");
		const client = ctx.fetch('client') as JsonableObject;
		const serverData = ctx.fetch('server_data') as { jwk: JWK, url: string , authenticationUrl: string };
		if(!serverData['jwk'] || !serverData['url']) throw Error("Server data is missing some parameters");

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
		const handler = getAuthenticateHandler(model, serverData.authenticationUrl);

		const cl = await model.setClient(client);
		if (!cl) {
			throw Error('Client is not valid');
		}

		const authorize_options = {
			model: model,
			authenticateHandler: handler,
			allowEmptyState: false,
			authorizationCodeLifetime: 5 * 60   // 5 minutes.
		}
		const res = await new AuthorizeHandler(authorize_options).handle_par(request, response);

		return ctx.pass(res);
	},
);

export const oauth = p;
