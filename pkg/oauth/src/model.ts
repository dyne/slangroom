import { AuthorizationCodeModel, Client, User, Token, Falsey, AuthorizationCode } from "@node-oauth/oauth2-server";
import { SignJWT, generateKeyPair, JWK, importJWK } from 'jose';
import { randomBytes } from 'crypto';

export class InMemoryCache implements AuthorizationCodeModel {
	clients: Client[];
	tokens: Token[];
	users: User[];
	codes: AuthorizationCode[];
	jwk: JWK;
	options: any;

	/**
	 * Constructor.
	 */
	constructor(jwk: JWK, options?:any) {

		this.options = options || {};
		this.jwk = jwk;

		const cl: Client = { id: 'thom', clientSecret: 'nightworld', grants: ["authorization_code"], redirectUris: ['https://Wallet.example.org/cb'] };
		const us: User = { id: '123', username: 'thomseddon', password: 'nightworld' };
		//Note that AuthCode need CodeChallenge/CodeChallengeMethod iff the request contains code_verifier
		const authCode: AuthorizationCode = { authorizationCode: 'SplxlOBeZQQYbYS6WxSbIA', expiresAt: new Date(Date.now() + 50000), redirectUri: 'https://Wallet.example.org/cb', client: cl, user: us, codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', codeChallengeMethod: 'S256', scope: ['xyz'], authorization_details: {type: 'openid_credential', credential_configuration_id: 'UniversityDegreeCredential' }  };
		const bearerToken: Token = {
			accessToken: 'mF_9.B5f-4.1JqM',
			accessTokenExpiresAt: new Date(Date.now() + 5000),
			client: cl,
			user: us
		}

		this.clients = [cl];
		this.tokens = [bearerToken];
		this.users = [us];
		this.codes = [authCode];
	}

	/**
	 * Invoked to retrieve an existing authorization code previously saved through Model#saveAuthorizationCode().
	 *
	 */
	getAuthorizationCode(authorizationCode: string): Promise<Falsey | AuthorizationCode> {
		var codes = this.codes.filter(function (code) {
			return code.authorizationCode === authorizationCode;
		});

		return Promise.resolve(codes[0]);
	}

	/**
	 * Invoked to save an authorization code.
	 *
	 */
	saveAuthorizationCode(code: Pick<AuthorizationCode, "authorizationCode" | "expiresAt" | "redirectUri" | "scope" | "codeChallenge" | "codeChallengeMethod">, client: Client, user: User): Promise<Falsey | AuthorizationCode> {
		let codeSaved: AuthorizationCode = {
			authorizationCode: code.authorizationCode,
			expiresAt: code.expiresAt,
			redirectUri: code.redirectUri,
			scope: code.scope,
			client: client,
			user: user
		};

		if (code.codeChallenge && code.codeChallengeMethod) {
			codeSaved = Object.assign({
				codeChallenge: code.codeChallenge,
				codeChallengeMethod: code.codeChallengeMethod
			}, codeSaved);
		}
		this.codes.push(codeSaved);
		return Promise.resolve(codeSaved);
	}

	/**
	 * Invoked to revoke an authorization code.
	 *
	 */
	revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
		var index = this.codes.indexOf(code);
		this.codes.splice(index, 1);

		return Promise.resolve(true);
	}


	/**
	 * Get access token.
	 */

	getAccessToken(bearerToken: string): Promise<Token | Falsey> {
		var tokens = this.tokens.filter(function (token) {
			return token.accessToken === bearerToken;
		});

		return Promise.resolve(tokens[0]);
	};

	/**
	 * Get refresh token.
	 */

	getRefreshToken(bearerToken: string) {
		var tokens = this.tokens.filter(function (token) {
			return token.refreshToken === bearerToken;
		});

		return tokens.length ? tokens[0] : false;
	};

	/**
	 * Get client.
	 */

	getClient(clientId: string, clientSecret: string): Promise<Client | Falsey> {
		if (clientSecret) {
			var clients = this.clients.filter(function (client: Client) {
				return client.id === clientId && client['clientSecret'] === clientSecret;
			});
			return Promise.resolve(clients[0]);
		}
		else {
			var clients = this.clients.filter(function (client: Client) {
				return client.id === clientId;
			});
			return Promise.resolve(clients[0]);
		}
	};

	/**
	 * Save token.
	 */

	saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
		const tokenSaved: Token = {
			accessToken: token.accessToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			refreshToken: token.refreshToken,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			client: client,
			user: user
		}
		if (token.scope) {
			Object.assign({ scope: token.scope }, tokenSaved);
		}

		tokenSaved['c_nonce'] = randomBytes(20).toString('hex');
		tokenSaved['c_nonce_expires_in'] = 60 * 60;

		if(this.options && this.options.allowExtendedTokenAttributes){
		//TODO: problem with authorization_details
			for(var key in token) {
				tokenSaved[key] = token[key];
			}
		}
		this.tokens.push(tokenSaved);

		return Promise.resolve(tokenSaved);
	};

	/**
	 * Invoked to check if the requested scope is valid for a particular client/user combination.
	 *
	 */

	validateScope(user: User, client: Client, scope?: string[] | undefined): Promise<string[] | Falsey> {
		//TODO
		// see https://openid.github.io/OpenID4VCI/openid-4-verifiable-credential-issuance-wg-draft.html#section-5.1.2
		if(user && client && scope)
			return Promise.resolve(scope);
		return Promise.resolve(undefined);
	}

	/**
	 * Generate access token.
	 */

	async generateAccessToken(client: Client, user: User, scope?: string[]): Promise<string> {

		if (scope) {
			const validatedScope = await this.validateScope(user, client, scope);
			if (!validatedScope) {
				throw new Error('Given scope is not valid for this client/user combination');
			}
		}

		const clientId = client.id;
		if (this.jwk != null)
			var privateKey = await importJWK(this.jwk);
		else {
			var keyPair = await generateKeyPair('ES256');
			privateKey = keyPair.privateKey;
		}
		const token = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({ alg: 'ES256' })
			.setIssuedAt(Date.now())
			.setIssuer('https://valid.issuer.url')
			.setAudience(clientId)
			.setExpirationTime('1h')
			.sign(privateKey);
		return token;

	};

}

// generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }
// generateAuthorizationCode?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }

// validateRedirectUri?(redirect_uri: string, client: Client): Promise<boolean> {
// 	throw new Error("Method not implemented.");
// }
/**
 * Invoked during request authentication to check if the provided access token was authorized the requested scopes.
 * Optional, if a custom authenticateHandler is used or if there is no scope part of the request.
 *
 */
// verifyScope?(token: Token, scope: string[]): Promise<boolean> {
// 	throw new Error("Method not implemented.");
// }
