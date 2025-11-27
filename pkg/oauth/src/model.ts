// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
	AuthorizationCode,
	AuthorizationCodeModel,
	Client,
	Falsey,
	InsufficientScopeError,
	InvalidTokenError,
	Request,
	Token,
	User,
} from '@node-oauth/oauth2-server';
import { JsonableObject } from '@slangroom/shared';
import { createHash, randomBytes } from 'crypto';
import {
	JWK,
	SignJWT,
	decodeJwt,
	decodeProtectedHeader,
	importJWK,
	jwtVerify
} from 'jose';

class OAuthError extends Error {
	constructor(message: string) {
		super();
		this.message = message;
		this.name = "Slangroom @slangroom/oauth2-server Error:\n\n";
	}
}

export type AuthorizationDetails = {
	type: 'openid_credential';
	credential_configuration_id?: string;
	format?: string;
	locations?: string[];
	vct?: string;
	claims?: {
		path: string[];
		mandatory?: boolean;
		display?: {
			name?: string;
			locale?: string;
		}
	}[];
	credential_definition?: {
		"@context"?: string[];
		type?: string[];
	};
	[key: string]: any;
}[];

type SimplifiedClaimConfig = {
	mandatory?: boolean;
};
type SimplifiedCredentialConfig = {
	vct?: string;
	scope?: string;
	claims?: Record<string, SimplifiedClaimConfig>;
};
type SimplifiedIssuerMetadata = {
	credential_configurations_supported: Record<string, SimplifiedCredentialConfig>;
};

export class InMemoryCache implements AuthorizationCodeModel {
	clients: Map<string, Client>;
	tokens: Token[];
	users: User[];
	codes: AuthorizationCode[];
	uri_codes: Map<string, AuthorizationCode>;
	authorization_details: Map<string, AuthorizationDetails>;
	serverData: { jwk: JWK, url: string };
	options: JsonableObject;
	dpop_jwks: { [key: string]: any }[];

	/**
	 * Constructor.
	 */
	constructor(serverData: { jwk: JWK, url: string }, options?: JsonableObject) {
		this.options = options || {};
		this.serverData = {
			jwk: serverData['jwk'],
			url: serverData['url']
		};

		this.clients = new Map();
		this.users = [];
		this.tokens = [];
		this.codes = [];
		this.uri_codes = new Map();
		this.authorization_details = new Map();
		this.dpop_jwks = [];
	}

	/**
	 * Create a new object Client in this.clients.
	 */

	setClient(client: Client): Client {
		const id = client.id;
		if (!id) {
			throw new OAuthError("Invalid Client, missing property 'id'");
		}
		const grants = client.grants;
		if (!grants) {
			throw new OAuthError("Invalid Client, missing property 'grants'");
		}
		// remove existing client
		if (this.clients.get(id)) {
			this.clients.delete(id);
		}
		this.clients.set(id, client);
		return client;
	}

	/**
	 * Invoked to revoke a client.
	 *
	 */
	revokeClient(client: Client): Promise<boolean> {
		return Promise.resolve(this.clients.delete(client.id));
	}

	/**
	 * Create a new object AuthorizationCode in this.codes.
	 */
	async setAuthorizationCode(code: { [key: string]: any }): Promise<AuthorizationCode | Falsey> {
		if (!code['authorizationCode']) {
			throw new OAuthError("Invalid Authorization Code, missing property 'authorizationCode'");
		}
		if (!code['expiresAt']) {
			throw new OAuthError("Invalid AuthorizationCode, missing property 'expiresAt'");
		}
		if (!code['redirectUri']) {
			throw new OAuthError("Invalid Authorization Code, missing property 'redirectUri'");
		}
		if (!code['client']) {
			throw new OAuthError("Invalid Authorization Code, missing property 'client'");
		}
		if (!code['user']) {
			throw new OAuthError("Invalid Authorization Code, missing property 'user'");
		}

		const publicKey = await importJWK(this.serverData.jwk);
		// TODO?: add more checks on payload/header?
		const outVerify = await jwtVerify(code['authorizationCode'], publicKey);
		if (!outVerify) {
			throw new OAuthError('Invalid Authorization Code, invalid signature');
		}

		const codeSaved: AuthorizationCode = {
			authorizationCode: code['authorizationCode'],
			expiresAt: new Date(code['expiresAt'] * 1000),
			redirectUri: code['redirectUri'],
			client: code['client'],
			user: code['user'],
			scope: code['scope'],
			codeChallenge: code['codeChallenge'],
			codeChallengeMethod: code['codeChallengeMethod'],
		};

		const keys = Object.keys(code);
		keys.forEach((key: string) => {
			if (!codeSaved[key]) {
				codeSaved[key] = code[key];
			}
		});

		this.codes.push(codeSaved);

		//if codeSaved.client is not in this.clients we set the new object Client
		const cl = await this.getClient(codeSaved.client.id);
		if (!cl) await this.setClient(codeSaved.client);

		return Promise.resolve(codeSaved);
	}

	getAuthorizationDetails(authorizationCode: string) {
		const auth_details = this.authorization_details.get(authorizationCode);
		if (!auth_details) throw new OAuthError("Failed to get authorization_details: given authorization_code is not valid");
		return auth_details;
	}

	updateAuthorizationDetails(request_uri: string, data: any) {
		const base_uri = "urn:ietf:params:oauth:request_uri:";
		const rand_uri = request_uri.replace(base_uri, "");
		const auth_code = this.getAuthCodeFromUri(rand_uri);
		const auth_details = this.getAuthorizationDetails(auth_code.authorizationCode);
		//TODO: case of multiple elem in auth_details
		if (auth_details[0]) {
			auth_details[0]['claims'] = data;
		}
		this.authorization_details.set(auth_code.authorizationCode, auth_details);
		return auth_details;
	}

	revokeAuthorizationDetails(authorizationCode: string) {
		this.authorization_details.delete(authorizationCode);
	}

	/**
	 * Invoked to retrieve an existing authorization code from this.codes.
	 *
	 */
	getAuthorizationCode(authorizationCode: string): Promise<Falsey | AuthorizationCode> {
		const codes = this.codes.filter(function (code) {
			return code.authorizationCode === authorizationCode;
		});
		return Promise.resolve(codes[0]);
	}

	/**
	 * Invoked to retrieve an existing authorization code previously saved through Model#saveAuthorizationCode().
	 *
	 */
	getAuthCodeFromUri(rand_uri: string) {
		const code = this.uri_codes.get(rand_uri);
		if (!code) throw new OAuthError("Failed to get Authorization Code: given request_uri is not valid");
		return code;
	}

	revokeAuthCodeFromUri(rand_uri: string, expired?: boolean) {
		const code = this.uri_codes.get(rand_uri);
		if (!code) throw new OAuthError("Authorization code does not exist on server");
		if (!expired) {
			this.codes.push(code);
		}
		this.uri_codes.delete(rand_uri);
	}

	/**
	 * Invoked to save an authorization code.
	 *
	 */
	saveAuthorizationCode(code: Pick<AuthorizationCode, "authorizationCode" | "expiresAt" | "redirectUri" | "scope" | "codeChallenge" | "codeChallengeMethod">, client: Client, user: User, authorization_details?: AuthorizationDetails, rand_uri?: string): Promise<Falsey | AuthorizationCode> {
		const codeSaved: AuthorizationCode = {
			authorizationCode: code.authorizationCode,
			expiresAt: code.expiresAt,
			redirectUri: code.redirectUri,
			scope: code.scope,
			client: client,
			user: user,
		};

		if (code.codeChallenge && code.codeChallengeMethod) {
			codeSaved.codeChallenge = code.codeChallenge
			codeSaved.codeChallengeMethod = code.codeChallengeMethod
		}
		if (authorization_details) {
			this.authorization_details.set(code.authorizationCode, authorization_details);
		}
		//TODO: check this
		if (rand_uri) {
			this.uri_codes.set(rand_uri, codeSaved);
		} else {
			this.codes.push(codeSaved);
		}

		return Promise.resolve(codeSaved);
	}

	/**
	 * Invoked to revoke an authorization code.
	 *
	 */
	revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
		this.codes = this.codes.filter(element => element !== code);
		return Promise.resolve(true);
	}

	/**
	 * Get access token.
	 */

	getAccessToken(bearerToken: string): Promise<Token | Falsey> {
		const tokens = this.tokens.filter(function (token) {
			return token.accessToken === bearerToken;
		});

		return Promise.resolve(tokens[0]);
	}

	/**
	 * Get refresh token.
	 */

	getRefreshToken(bearerToken: string) {
		const tokens = this.tokens.filter(function (token) {
			return token.refreshToken === bearerToken;
		});

		return tokens.length ? tokens[0] : false;
	}


	/**
	 * Get client.
	 */
	async getClient(clientId: string, clientSecret?: string): Promise<Client | Falsey> {
		const client = this.clients.get(clientId);

		if (client && clientSecret && client['clientSecret'] != clientSecret) {
			new OAuthError("clientSecret does not match. This means that there are possibly many client with the same id");
		}
		return Promise.resolve(client);
	}

	/**
	 * Save token.
	 */

	async saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
		const tokenSaved: Token = {
			accessToken: token.accessToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshToken: token.refreshToken,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			client: client,
			user: user,
		};
		if (token.scope) {
			tokenSaved.scope = token.scope;
			if (client['resource']) {
				tokenSaved['resource'] = client['resource'];
			}
		}
		if (token['authorizationCode']) {
			const auth_details = this.authorization_details.get(token['authorizationCode']);
			if (auth_details) tokenSaved['authorization_details'] = auth_details;
		}
		tokenSaved['c_nonce'] = randomBytes(20).toString('hex');
		tokenSaved['c_nonce_expires_in'] = 60 * 60;

		const dpop_jwk = await this.getDpopJWK(client.id);
		if (dpop_jwk) {
			//for reference see: https://datatracker.ietf.org/doc/html/rfc9449.html#section-6.1
			tokenSaved['jkt'] = this.createJWKThumbprint(dpop_jwk['jwk']);
		}
		if (this.options && this.options['allowExtendedTokenAttributes']) {
			const keys = Object.keys(token);
			keys.forEach((key: string) => {
				if (!tokenSaved[key]) {
					tokenSaved[key] = token[key];
				}
			});
		}
		this.tokens.push(tokenSaved);

		return Promise.resolve(tokenSaved);
	}


	/**
	 * Create a JWT with a random value in payload,
	 *  issued by this.serverData.url, signed with the private key in this.serverData.jwk,
	 *  the input string is set as the audience parameter.
	 */

	async createServerJWS(clientId: string) {
		if (this.serverData.jwk == null) throw new OAuthError("Missing server private JWK");
		const privateKey = await importJWK(this.serverData.jwk);
		const alg = this.serverData.jwk.alg || 'ES256';
		const public_jwk: JWK = {
			kty: this.serverData.jwk.kty!,
			x: this.serverData.jwk.x!,
			y: this.serverData.jwk.y!,
			crv: this.serverData.jwk.crv!
		}

		const jws = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({
				alg: alg,
				jwk: public_jwk
			})
			.setIssuedAt(Math.round(Date.now() / 1000))
			.setIssuer(this.serverData.url)
			.setAudience(clientId)
			.setExpirationTime('1h')
			.sign(privateKey);
		return jws;
	}

	/**
	 * Generate access token.
	 */

	async generateAccessToken(client: Client): Promise<string> {
		const clientId = client.id;
		const token = this.createServerJWS(clientId);
		return token;
	}

	/**
	 * Generate authorization code.
	 */
	async generateAuthorizationCode(client: Client): Promise<string> {
		const clientId = client.id;
		const authCode = this.createServerJWS(clientId);
		return authCode;
	}

	// For reference see Section 4.3 of RFC9449 https://datatracker.ietf.org/doc/html/rfc9449.html
	async verifyDpopProof(dpop: string, request: Request) {
		const FIVE_MIN = 300000;
		const defaultValues = {
			typ: 'dpop+jwt',
			alg: 'ES256',
			htm: request.method,
			iat: Math.round(Date.now() / 1000) - FIVE_MIN
		};

		const header = decodeProtectedHeader(dpop);

		if (!header.typ) throw new OAuthError('Invalid DPoP: missing typ header parameter');
		if (!header.alg) throw new OAuthError('Invalid DPoP: missing alg header parameter');
		if (!header.jwk) throw new OAuthError('Invalid DPoP: missing jwk header parameter');

		if (header.typ !== defaultValues.typ) throw new OAuthError('Invalid DPoP: typ must be dpop+jwt');
		if (header.alg !== defaultValues.alg) throw new OAuthError('Invalid DPoP: alg must be ES256');
		// Missing check: The jwk JOSE Header Parameter does not contain a private key.

		const publicKey = await importJWK(header.jwk);
		const verify_sig = await jwtVerify(dpop, publicKey);
		if (!verify_sig) {
			throw new OAuthError('Invalid DPoP: invalid signature');
		}

		const payload = decodeJwt(dpop);

		if (!payload.iat) throw new OAuthError('Invalid DPoP: missing iat payload parameter');
		if (!payload.jti) throw new OAuthError('Invalid DPoP: missing jti payload parameter');
		if (!payload['htm']) throw new OAuthError('Invalid DPoP: missing htm payload parameter');
		if (!payload['htu']) throw new OAuthError('Invalid DPoP: missing htu payload parameter');

		if (payload.iat < defaultValues.iat) throw new OAuthError('Invalid DPoP: expired');
		if (payload['htm'] !== defaultValues.htm)
			throw new OAuthError('Invalid DPoP: htm does not match request method');
		// Missing check: The htu claim matches the HTTP URI value for the HTTP request in which the JWT was received, ignoring any query and fragment parts.

		return true;
	}

	async verifyDpopHeader(request: Request) {
		if (request.headers) {
			const dpop = request.headers['dpop'];
			if (dpop) {
				const check = await this.verifyDpopProof(dpop, request);
				if (!check) throw new OAuthError('Invalid request: DPoP header parameter is not valid');
				const header = decodeProtectedHeader(dpop);
				const dpop_saved = { id: request.body['client_id'], jwk: header.jwk };
				this.dpop_jwks.push(dpop_saved);
			}
		}
		return true;
	}

	getDpopJWK(id: string) {
		const jwks = this.dpop_jwks.filter(function (dpop_jwk: any) {
			return dpop_jwk.id === id;
		});
		return Promise.resolve(jwks[0]);
	}

	//for reference see: https://datatracker.ietf.org/doc/html/rfc7638
	createJWKThumbprint(jwk: JWK) {
		const jwk_str = JSON.stringify(jwk, Object.keys(jwk).sort());
		const jwk_utf8 = new Uint8Array(Buffer.from(jwk_str));

		const digest = new Uint8Array(createHash('SHA256').update(jwk_utf8).digest());

		return Buffer.from(digest).toString('base64url');
	}

	validateRedirectUri(redirect_uri: string, client: Client): Promise<boolean> {
		if (redirect_uri && client)
			return Promise.resolve(true);
		return Promise.resolve(true);
	}

	private async getIssuerMetadata(resource: string): Promise<SimplifiedIssuerMetadata> {
		if (resource.slice(-1) === "/") resource = resource.slice(0, -1);
		const url = resource + '/.well-known/openid-credential-issuer';
		const response = await fetch(url);
		if (!response.ok) {
			throw new OAuthError(`Fetch to url ${url} failed with error status: ${response.status}`);
		}
		const result = await response.json();
		return result;
	}
	private extractMandatoryClaims(entry: SimplifiedCredentialConfig) {
		return Object.entries(entry.claims ?? {})
			.filter(([_, claim]) => claim?.mandatory)
			.map(([key]) => key);
	}
	private findCredentialEntry(supported: Record<string, SimplifiedCredentialConfig>, predicate: (key: string, value: SimplifiedCredentialConfig) => boolean) {
		const found = Object.entries(supported).find(([key, value]) => predicate(key, value));
		return found?.[1];
	}
	private buildResponse(id: string, entry: SimplifiedCredentialConfig) {
		const claims = this.extractMandatoryClaims(entry);
		return {
			valid_credentials: [id],
			credential_claims: new Map([[id, claims]]),
		};
	}

	async verifyCredentialId(id: string, resource: string) {
		const supported = (await this.getIssuerMetadata(resource)).credential_configurations_supported;
		const entry = this.findCredentialEntry(
			supported,
			(key, _) => key === id
		);
		return entry
			? this.buildResponse(id, entry)
			: { valid_credentials: [], credential_claims: new Map<string, string[]>() };
	}

	async verifyCredentialVct(vct: string, resource: string) {
		const supported = (await this.getIssuerMetadata(resource)).credential_configurations_supported;
		const entry = this.findCredentialEntry(
			supported,
			(_, value) => value.vct === vct
		);
		return entry
			? this.buildResponse(vct, entry)
			: { valid_credentials: [], credential_claims: new Map<string, string[]>() };
	}

	async validateScope(user: User, client: Client, scope?: string[] | undefined, resource?: string): Promise<string[]> {
		if (!user || !client) throw new OAuthError("Invalid input parameters for ValidateScope");
		if (!scope || scope.length === 0) throw new InsufficientScopeError('Insufficient scope: authorized scope is insufficient');
		const resourceUrl = resource ?? client['resource'];
		if (!resourceUrl) throw new OAuthError('Invalid request: needed resource to verify scope');
		const supported = (await this.getIssuerMetadata(resourceUrl)).credential_configurations_supported;
		const validScopes: string[] = [];
		for (const s of scope) {
			const entry = this.findCredentialEntry(
				supported,
				(key, value) => value.scope === s || key === s
			);
			if (!entry) throw new InsufficientScopeError('Insufficient scope: authorized scope is insufficient');
			validScopes.push(s);
		}
		return validScopes;
	}

	async getAuthDetailsFromToken(accessToken: string) {
		const token = await this.getAccessToken(accessToken);
		if (!token) throw new InvalidTokenError("Given token is not valid");
		const auth_details = token['authorization_details'];
		if (!auth_details) throw new InvalidTokenError("authorization_details not found in accessToken");

		return auth_details;
	}
}

// generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }

