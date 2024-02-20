import { AuthorizationCodeModel, Client, User, Token, Falsey, AuthorizationCode, Request } from "@node-oauth/oauth2-server";
import { SignJWT, jwtVerify, generateKeyPair, JWK, importJWK, decodeProtectedHeader, decodeJwt } from 'jose';
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
	constructor(jwk: JWK, options?: any) {

		this.options = options || {};
		this.jwk = jwk;

		this.clients = [];
		this.users = [];
		this.tokens = [];
		this.codes = [];
	}

	/**
	 * Create a new object Client in this.clients.
	 */

	setClient(client: { [key: string]: any }): Promise<Client | Falsey> {

		if (!client["id"]) {
			throw Error("Invalid Client, missing property 'id'");
		}
		if (!client["grants"]) {
			throw Error("Invalid Client, missing property 'grants'");
		}
		if (!client["clientSecret"]) {
			throw Error("Invalid Client, missing property 'clientSecret'");
		}

		const clientSaved: Client = {
			id: client["id"],
			grants: client["grants"],
			clientSecret: client["clientSecret"],
			redirectUris: client["redirectUris"],
			accessTokenLifetime: client["accessTokenLifetime"],
			refreshTokenLifetime: client["refreshTokenLifetime"]
		}

		this.clients.push(clientSaved);
		return Promise.resolve(clientSaved);
	};

	/**
	 * Create a new object AuthorizationCode in this.codes.
	 */
	async setAuthorizationCode(code: { [key: string]: any }): Promise<AuthorizationCode | Falsey> {

		if (!code["authorizationCode"]) {
			throw Error("Invalid Authorization Code, missing property 'authorizationCode'");
		}
		if (!code["expiresAt"]) {
			throw Error("Invalid AuthorizationCode, missing property 'expiresAt'");
		}
		if (!code["redirectUri"]) {
			throw Error("Invalid Authorization Code, missing property 'redirectUri'");
		}
		if (!code["client"]) {
			throw Error("Invalid Authorization Code, missing property 'client'");
		}
		if (!code["user"]) {
			throw Error("Invalid Authorization Code, missing property 'user'");
		}

		const publicKey = await importJWK(this.jwk);
		// TODO?: add more checks on payload/header?
		const outVerify = await jwtVerify(code["authorizationCode"], publicKey);
		if(!outVerify){
			throw Error("Invalid Authorization Code, invalid signature");
		}

		const codeSaved: AuthorizationCode = {
			authorizationCode: code["authorizationCode"],
			expiresAt: new Date(code["expiresAt"]),
			redirectUri: code["redirectUri"],
			client: code["client"],
			user: code["user"],
			scope: code["scope"],
			codeChallenge: code["codeChallenge"],
			codeChallengeMethod: code["codeChallengeMethod"]
		}
		var keys = Object.keys(codeSaved);
		let missingKeys = Object.keys(code).filter(item => keys.indexOf(item) < 0);

		missingKeys.forEach(function (key) {
			codeSaved[key] = code[key];
		});

		this.codes.push(codeSaved);

		//if codeSaved.client is not in this.clients we set the new object Client
		const cl = await this.getClient(codeSaved.client.id);
		if (!cl) this.setClient(codeSaved.client);

		return Promise.resolve(codeSaved);
	};

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

	getClient(clientId: string, clientSecret?: string): Promise<Client | Falsey> {
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

		if (this.options && this.options.allowExtendedTokenAttributes) {
			//TODO: problem with authorization_details
			var keys = Object.keys(tokenSaved);
			let missingKeys = Object.keys(token).filter(item => keys.indexOf(item) < 0);
			missingKeys.forEach(function (key) {
				tokenSaved[key] = token[key];
			});
		}
		this.tokens.push(tokenSaved);

		return Promise.resolve(tokenSaved);
	};

	/**
	 * Generate access token.
	 */

	async generateAccessToken(client: Client): Promise<string> {

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

	/**
	 * Generate authorization code.
	 */
	async generateAuthorizationCode(client: Client): Promise<string> {

		const clientId = client.id;
		if (this.jwk != null)
			var privateKey = await importJWK(this.jwk);

		else {
			var keyPair = await generateKeyPair('ES256');
			privateKey = keyPair.privateKey;
		}

		const authCode = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({ alg: 'ES256' })
			.setIssuedAt(Date.now())
			.setIssuer('https://valid.issuer.url')
			.setAudience(clientId)
			.setExpirationTime('1h')
			.sign(privateKey);
		return authCode;
	}

// For reference see Section 4.3 of https://datatracker.ietf.org/doc/html/rfc9449.html
	async verifyDpopProof(dpop:string, request: Request){

		const header = decodeProtectedHeader(dpop);

		if(!header.typ) throw Error("Invalid DPoP: missing typ header parameter");
		if(header.typ !== "dpop+jwt") throw Error("Invalid DPoP: typ must be dpop+jwt");

		if(!header.alg) throw Error("Invalid DPoP: missing alg header parameter");
		if(header.alg !== 'ES256') throw Error("Invalid DPoP: alg must be ES256");

		if(!header.jwk) throw Error("Invalid DPoP: missing jwk header parameter");
		// Missing check: The jwk JOSE Header Parameter does not contain a private key.
		const publicKey = await importJWK(header.jwk);
		const verify_sig = await jwtVerify(dpop, publicKey);
		if(!verify_sig){
			throw Error("Invalid DPoP: invalid signature");
		}

		const payload = decodeJwt(dpop);

		if(!payload.iat) throw Error("Invalid DPoP: missing iat payload parameter");
		var FIVE_MIN=5*60*1000;
		var date = new Date().getTime();
		if((date - payload.iat) > FIVE_MIN)	throw Error("Invalid DPoP: expired");

		if(!payload.jti) throw Error("Invalid DPoP: missing jti payload parameter");

		if(!payload['htm']) throw Error("Invalid DPoP: missing htm payload parameter");
		if(payload['htm'] !== request.method) throw Error("Invalid DPoP: htm does not match request method");

		if(!payload['htu']) throw Error("Invalid DPoP: missing htu payload parameter");
		// Missing check: The htu claim matches the HTTP URI value for the HTTP request in which the JWT was received, ignoring any query and fragment parts.
		return true;
	}
}

// generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }

// validateRedirectUri?(redirect_uri: string, client: Client): Promise<boolean> {
// 	throw new Error("Method not implemented.");
// }
