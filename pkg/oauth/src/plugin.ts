import { Plugin } from '@slangroom/core';
import OAuth2Server from '@node-oauth/oauth2-server';
import { Request } from '@node-oauth/oauth2-server';
import { Response } from '@node-oauth/oauth2-server';
import { InMemoryCache } from '@slangroom/oauth';
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
		if (key != undefined) { dictionary[key] = value; }

	}

	// Step 4: Return Dictionary Object
	return dictionary;
}


let inMemoryCache: InMemoryCache | null = null;
const getInMemoryCache = (jwk: JWK): InMemoryCache => {
	if (!inMemoryCache) {
		inMemoryCache = new InMemoryCache(jwk);
	}
	return inMemoryCache;
}

/**
 * @internal
 */

//Add sentence that allows to generate and output a valid access token from an auth server backend
export const createToken = p.new(
	['body', 'headers', 'jwk'],
	'generate access token',
	async (ctx) => {

		const params = ctx.fetch('body') as 'string';
		const headers = ctx.fetch('headers');
		const jwk = ctx.fetch('jwk') as JsonableObject;
		const request = new Request({
			body: parseQueryStringToDictionary(params),
			headers: headers,
			method: "POST",
			query: {}
		})

		const response = new Response();
		var server = new OAuth2Server({
			model: getInMemoryCache(jwk)
		});
		return ctx.pass(await server.token(request, response))
	}
);

export const oauth = p;
