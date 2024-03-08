import {
	AuthorizationCode,
	AuthorizationCodeModel,
	Client,
	Falsey,
	InsufficientScopeError,
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

export class InMemoryCache implements AuthorizationCodeModel {
	clients: Map<string, Client>;
	tokens: Token[];
	users: User[];
	codes: AuthorizationCode[];
	uri_codes: Map<string, AuthorizationCode>;
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
		this.dpop_jwks = [];
	}

	/**
	 * Create a new object Client in this.clients.
	 */

	async setClient(client: { [key: string]: any }): Promise<Client> {
		if (!client['id']) {
			throw new OAuthError("Invalid Client, missing property 'id'");
		}
		if (!client['grants']) {
			throw new OAuthError("Invalid Client, missing property 'grants'");
		}
		if (!client['clientSecret']) {
			throw new OAuthError("Invalid Client, missing property 'clientSecret'");
		}
		const ex_client = await this.getClient(client['id'], client['clientSecret'])

		if (ex_client) {
			this.revokeClient(ex_client);
		}

		const clientSaved: Client = {
			id: client['id'],
			grants: client['grants'],
			clientSecret: client['clientSecret'],
			redirectUris: client['redirectUris'],
			accessTokenLifetime: client['accessTokenLifetime'],
			refreshTokenLifetime: client['refreshTokenLifetime'],
			scope: client['scope'],
			resource: client['resource']
		};

		this.clients.set(client['id'], clientSaved);
		return clientSaved;
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

		var keys = Object.keys(code);
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

	/**
	 * Invoked to retrieve an existing authorization code from this.codes.
	 *
	 */
	getAuthorizationCode(authorizationCode: string): Promise<Falsey | AuthorizationCode> {
		var codes = this.codes.filter(function (code) {
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
		if(!code) throw new OAuthError("Failed to get Authorization Code: given request_uri is not valid");
		return code;
	}

	revokeAuthCodeFromUri(rand_uri: string, expired?: boolean) {
		const code = this.uri_codes.get(rand_uri);
		if(!code) throw new OAuthError("Authorization code does not exist on server");
		if(!expired) {
			this.codes.push(code);
		}
		this.uri_codes.delete(rand_uri);
	}

	/**
	 * Invoked to save an authorization code.
	 *
	 */
	saveAuthorizationCode(code: Pick<AuthorizationCode, "authorizationCode" | "expiresAt" | "redirectUri" | "scope" | "codeChallenge" | "codeChallengeMethod">, client: Client, user: User, rand_uri?: string): Promise<Falsey | AuthorizationCode> {
		let codeSaved: AuthorizationCode = {
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
		//TODO: check this
		if(rand_uri) {
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
		const client = this.clients.get(clientId);

		if (client && clientSecret) {
			if (client['clientSecret'] != clientSecret) {
				new OAuthError("clientSecret does not match. This means that there are possibly many client with the same id");
			}
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
		if (this.serverData.jwk == null) throw new OAuthError("Missing server private JWK");
		let privateKey = await importJWK(this.serverData.jwk);
		let alg = this.serverData.jwk.alg || 'ES256';
		let public_jwk:JWK = {
			kty: this.serverData.jwk.kty!,
			x: this.serverData.jwk.x!,
			y: this.serverData.jwk.y!,
			crv: this.serverData.jwk.crv!
		}

		const jws = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({ alg: alg,
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
		let FIVE_MIN = 300000;
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
			var dpop = request.headers['dpop'];
			if (dpop) {
				var check = await this.verifyDpopProof(dpop, request);
				if (!check) throw new OAuthError('Invalid request: DPoP header parameter is not valid');
				const header = decodeProtectedHeader(dpop);
				const dpop_saved = { id: request.body['client_id'], jwk: header.jwk };
				this.dpop_jwks.push(dpop_saved);
			}
		}
		return true;
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
		if (redirect_uri && client)
			return Promise.resolve(true);
		return Promise.resolve(true);
	}


	async validateScope?(user: User, client: Client, scope?: string[] | undefined, resource?: string): Promise<Falsey | string[]> {

		if (!user || !client) throw new OAuthError("Invalid input parameters for ValidateScope");

		if (!scope) {
			throw new InsufficientScopeError(
				'Insufficient scope: authorized scope is insufficient',
			);
		}
		if (!resource) {
			var resource = client['resource'] as string | undefined;
			if (!resource)
				throw new OAuthError('Invalid request: needed resource to verify scope');
		}
		const url = resource + '/.well-known/openid-credential-issuer';
		const response = await fetch(url);
		if (!response.ok) {
			throw new OAuthError(`Fetch to url ${url} failed with error status: ${response.status}`);
		}
		const result = await response.json();
		const credentials_supported = result.credentials_supported;
		var valid_credentials = [];

		for (var key in credentials_supported) {
			const type_arr = credentials_supported[key].credential_definition.type;
			if (
				type_arr.find((id: any) => {
					return id === scope[0];
				}) != undefined
			) {
				valid_credentials.push(scope);
				break;
			}
		}

		if (valid_credentials.length > 0) return Promise.resolve(scope);
		else return false;

	}
}

// generateRefreshToken?(client: Client, user: User, scope: string[]): Promise<string> {
// 	throw new Error("Method not implemented.");
// }

