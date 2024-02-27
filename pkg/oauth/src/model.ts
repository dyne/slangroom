import {
	AuthorizationCodeModel,
	Client,
	User,
	Token,
	Falsey,
	AuthorizationCode,
	Request,
} from '@node-oauth/oauth2-server';
import {
	SignJWT,
	jwtVerify,
	JWK,
	importJWK,
	decodeProtectedHeader,
	decodeJwt
} from 'jose';
import { createHash, randomBytes } from 'crypto';
import { JsonableObject } from '@slangroom/shared';

export class InMemoryCache implements AuthorizationCodeModel {
	clients: Client[];
	tokens: Token[];
	users: User[];
	codes: AuthorizationCode[];
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

		this.clients = [];
		this.users = [];
		this.tokens = [];
		this.codes = [];
		this.dpop_jwks = [];
	}

	/**
	 * Create a new object Client in this.clients.
	 */

	setClient(client: { [key: string]: any }): Promise<Client | Falsey> {
		if (!client['id']) {
			throw Error("Invalid Client, missing property 'id'");
		}
		if (!client['grants']) {
			throw Error("Invalid Client, missing property 'grants'");
		}
		if (!client['clientSecret']) {
			throw Error("Invalid Client, missing property 'clientSecret'");
		}

		const clientSaved: Client = {
			id: client['id'],
			grants: client['grants'],
			clientSecret: client['clientSecret'],
			redirectUris: client['redirectUris'],
			accessTokenLifetime: client['accessTokenLifetime'],
			refreshTokenLifetime: client['refreshTokenLifetime'],
		};

		this.clients.push(clientSaved);
		return Promise.resolve(clientSaved);
	}

	/**
	 * Create a new object AuthorizationCode in this.codes.
	 */
	async setAuthorizationCode(code: { [key: string]: any }): Promise<AuthorizationCode | Falsey> {
		if (!code['authorizationCode']) {
			throw Error("Invalid Authorization Code, missing property 'authorizationCode'");
		}
		if (!code['expiresAt']) {
			throw Error("Invalid AuthorizationCode, missing property 'expiresAt'");
		}
		if (!code['redirectUri']) {
			throw Error("Invalid Authorization Code, missing property 'redirectUri'");
		}
		if (!code['client']) {
			throw Error("Invalid Authorization Code, missing property 'client'");
		}
		if (!code['user']) {
			throw Error("Invalid Authorization Code, missing property 'user'");
		}

		const publicKey = await importJWK(this.serverData.jwk);
		// TODO?: add more checks on payload/header?
		const outVerify = await jwtVerify(code['authorizationCode'], publicKey);
		if (!outVerify) {
			throw Error('Invalid Authorization Code, invalid signature');
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

		var keys = Object.keys(code);
		keys.forEach((key: string) => {
			if (!codeSaved[key]) {
				codeSaved[key] = code[key];
			}
		});

		this.codes.push(codeSaved);

		//if codeSaved.client is not in this.clients we set the new object Client
		const cl = await this.getClient(codeSaved.client.id);
		if (!cl) this.setClient(codeSaved.client);

		return Promise.resolve(codeSaved);
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
			user: user,
		};

		if (code.codeChallenge && code.codeChallengeMethod) {
			codeSaved = Object.assign(
				{
					codeChallenge: code.codeChallenge,
					codeChallengeMethod: code.codeChallengeMethod,
				},
				codeSaved
			);
		}
		this.codes.push(codeSaved);
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
		var tokens = this.tokens.filter(function (token) {
			return token.accessToken === bearerToken;
		});

		return Promise.resolve(tokens[0]);
	}

	/**
	 * Get refresh token.
	 */

	getRefreshToken(bearerToken: string) {
		var tokens = this.tokens.filter(function (token) {
			return token.refreshToken === bearerToken;
		});

		return tokens.length ? tokens[0] : false;
	}

	/**
	 * Get client.
	 */

	getClient(clientId: string, clientSecret?: string): Promise<Client | Falsey> {
		if (clientSecret) {
			var clients = this.clients.filter(function (client: Client) {
				return client.id === clientId && client['clientSecret'] === clientSecret;
			});
			return Promise.resolve(clients[0]);
		} else {
			var clients = this.clients.filter(function (client: Client) {
				return client.id === clientId;
			});
			return Promise.resolve(clients[0]);
		}
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
			Object.assign({ scope: token.scope }, tokenSaved);
		}

		tokenSaved['c_nonce'] = randomBytes(20).toString('hex');
		tokenSaved['c_nonce_expires_in'] = 60 * 60;

		const dpop_jwk = await this.getDpopJWK(client.id);
		if (dpop_jwk) {
			//for reference see: https://datatracker.ietf.org/doc/html/rfc9449.html#section-6.1
			tokenSaved['jkt'] = this.createJWKThumbprint(dpop_jwk['jwk']);
		}
		if (this.options && this.options['allowExtendedTokenAttributes']) {
			//TODO: problem with authorization_details
			var keys = Object.keys(token);
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
		if (this.serverData.jwk == null) throw Error("Missing server private JWK");
		let privateKey = await importJWK(this.serverData.jwk);
		let alg = this.serverData.jwk.alg || 'ES256';

		const jws = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({ alg: alg })
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
		let FIVE_MIN = 300000;
		const defaultValues = {
			typ: 'dpop+jwt',
			alg: 'ES256',
			htm: request.method,
			iat: Math.round(Date.now() / 1000) - FIVE_MIN
		};

		const header = decodeProtectedHeader(dpop);

		if (!header.typ) throw Error('Invalid DPoP: missing typ header parameter');
		if (!header.alg) throw Error('Invalid DPoP: missing alg header parameter');
		if (!header.jwk) throw Error('Invalid DPoP: missing jwk header parameter');

		if (header.typ !== defaultValues.typ) throw Error('Invalid DPoP: typ must be dpop+jwt');
		if (header.alg !== defaultValues.alg) throw Error('Invalid DPoP: alg must be ES256');
		// Missing check: The jwk JOSE Header Parameter does not contain a private key.

		const publicKey = await importJWK(header.jwk);
		const verify_sig = await jwtVerify(dpop, publicKey);
		if (!verify_sig) {
			throw Error('Invalid DPoP: invalid signature');
		}

		const payload = decodeJwt(dpop);

		if (!payload.iat) throw Error('Invalid DPoP: missing iat payload parameter');
		if (!payload.jti) throw Error('Invalid DPoP: missing jti payload parameter');
		if (!payload['htm']) throw Error('Invalid DPoP: missing htm payload parameter');
		if (!payload['htu']) throw Error('Invalid DPoP: missing htu payload parameter');

		if (payload.iat < defaultValues.iat) throw Error('Invalid DPoP: expired');
		if (payload['htm'] !== defaultValues.htm)
			throw Error('Invalid DPoP: htm does not match request method');
		// Missing check: The htu claim matches the HTTP URI value for the HTTP request in which the JWT was received, ignoring any query and fragment parts.

		return true;
	}

	async setupTokenRequest(authCode: { [key: string]: any }, request: Request) {
		const code = await this.setAuthorizationCode(authCode);
		if (request.headers) {
			var dpop = request.headers['dpop'];
			if (dpop) {
				var check = await this.verifyDpopProof(dpop, request);
				if (!check) throw Error('Invalid request: DPoP header parameter is not valid');
				const header = decodeProtectedHeader(dpop);
				const dpop_saved = { id: authCode['client'].id, jwk: header.jwk };
				this.dpop_jwks.push(dpop_saved);
			}
		}
		return code;
	}

	getDpopJWK(id: string) {
		var jwks = this.dpop_jwks.filter(function (dpop_jwk: any) {
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

	validateRedirectUri?(redirect_uri: string, client: Client): Promise<boolean> {
		if(redirect_uri && client)
			return Promise.resolve(true);
		return Promise.resolve(true);
	}
	// validateScope?(user: User, client: Client, scope?: string[] | undefined):Promise<Falsey | string[]>{
	// 	if(user && client && scope)
	// 		return Promise.resolve(scope);
	// 	return Promise.resolve(scope);
	// }
}

// generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }

