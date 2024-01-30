import { AuthorizationCodeModel, Client, User, Token, Falsey, AuthorizationCode } from "@node-oauth/oauth2-server";
import { SignJWT, generateKeyPair, JWK, importJWK} from 'jose';
import { randomBytes } from 'crypto';


export class InMemoryCache implements AuthorizationCodeModel {
	clients: Client[];
	tokens: Token[];
	users: User[];
	codes: AuthorizationCode[];
	jwk: JWK;

	/**
	 * Constructor.
	 */
	constructor(jwk: JWK) {
		const cl:Client = { id: 'thom', clientSecret: 'nightworld', grants: ["authorization_code"], redirectUris: ['https://Wallet.example.org/cb'] };
		const us:User = { id: '123', username: 'thomseddon', password: 'nightworld' };
		//Note that AuthCode need CodeChallenge/CodeChallengeMethod iff the request contains code_verifier
		const authCode:AuthorizationCode = { authorizationCode: 'SplxlOBeZQQYbYS6WxSbIA', expiresAt: new Date(Date.now()+50000), redirectUri: 'https://Wallet.example.org/cb', client: cl, user: us, codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', codeChallengeMethod: 'S256' };

		this.jwk = jwk;
		this.clients = [cl];
		this.tokens = [];
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

		if(code.codeChallenge && code.codeChallengeMethod){
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
		// TODO: check what this should actually do
		if (code.expiresAt.getTime() < Date.now()) {
			var index = this.codes.indexOf(code);
			this.codes.splice(index,1);
		}
		return Promise.resolve(true);
	}

	/**
	 * Dump the cache.
	 */

	dump() {
		console.log('clients', this.clients);
		console.log('tokens', this.tokens);
		console.log('users', this.users);
	};

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
		if(clientSecret) {
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
		this.tokens.push(tokenSaved);
		const clients = this.clients.filter(function (client) {
			return client.id === tokenSaved.client.id
		});
		if (clients[0]) tokenSaved.client = clients[0];
		tokenSaved.user = user;
		return Promise.resolve(tokenSaved);
	};

	/**
	 * Generate access token.
	 */

	async generateAccessToken(client: Client, user: User, scope?: string[]): Promise<string> {

		if(user && scope) console.log('11');

		const clientId = client.id;
		if(this.jwk != null)
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
