import { Request, Response, AuthorizationCodeModel, Token, InvalidArgumentError, ServerOptions, ClientCredentialsModel, ExtensionModel, InsufficientScopeError, InvalidRequestError, InvalidTokenError, OAuthError, PasswordModel, RefreshTokenModel, ServerError, UnauthorizedRequestError } from "@node-oauth/oauth2-server";
import { importJWK, jwtVerify } from "jose";
import bs58 from 'bs58';

export class AuthenticateHandler {

	addAcceptedScopesHeader: boolean | undefined;
	addAuthorizedScopesHeader: boolean | undefined;
	allowBearerTokensInQueryString: boolean | undefined;
	model: AuthorizationCodeModel | ClientCredentialsModel | RefreshTokenModel | PasswordModel | ExtensionModel;
	scope: string[] | undefined;

	constructor(options: ServerOptions) {
		options = options || {};

		if (!options.model) {
			throw new InvalidArgumentError('Missing parameter: `model`');
		}

		if (!options.model.getAccessToken) {
			throw new InvalidArgumentError('Invalid argument: model does not implement `getAccessToken()`');
		}

		if (options.scope && undefined === options.addAcceptedScopesHeader) {
			throw new InvalidArgumentError('Missing parameter: `addAcceptedScopesHeader`');
		}

		if (options.scope && undefined === options.addAuthorizedScopesHeader) {
			throw new InvalidArgumentError('Missing parameter: `addAuthorizedScopesHeader`');
		}
	//	console.log(options.scope && !options.model.verifyScope) = undefined but pass the check
		if (options.scope && !options.model.verifyScope) {
			throw new InvalidArgumentError('Invalid argument: model does not implement `verifyScope()`');
		}

		this.addAcceptedScopesHeader = options.addAcceptedScopesHeader;
		this.addAuthorizedScopesHeader = options.addAuthorizedScopesHeader;
		this.allowBearerTokensInQueryString = options.allowBearerTokensInQueryString;
		this.model = options.model;
		this.scope = options.scope;
	}

	/**
	 * Authenticate Handler.
	 */

	async handle(request: Request, response: Response) {
		if (!(request instanceof Request)) {
			throw new InvalidArgumentError('Invalid argument: `request` must be an instance of Request');
		}

		if (!(response instanceof Response)) {
			throw new InvalidArgumentError('Invalid argument: `response` must be an instance of Response');
		}

		try {
			const cl_id = request.body.client_id;
			const cl_sec = request.body.clientSecret;
			const client = await this.model.getClient(cl_id, cl_sec);
			if (!client) {
				throw new Error("Invalid Client");
			}

			const scope = request.body.scope;
			const resource = request.body.resource;
			if (!this.verifyScope(scope, resource)){
				throw new Error("Given scope is not valid");
			}

			const url = "https://did.dyne.org/dids/" + cl_id;

			const response = await fetch(url, {method: 'GET'});
			if (!response.ok) {
				throw new Error(`Error! status: ${response.status}`);
			}

			const result = await response.json();
			const base58Key = result.didDocument.verificationMethod.find((value: any) => value.type == 'EcdsaSecp256r1VerificationKey').publicKeyBase58

			const uint8ArrKey = bs58.decode(base58Key);
			const base64_x_Key = Buffer.from(uint8ArrKey.buffer.slice(0, 32)).toString('base64url');
			const base64_y_Key = Buffer.from(uint8ArrKey.buffer.slice(32)).toString('base64url');

			const publicKey = await importJWK(
				{
					crv: 'P-256',
					kty: 'EC',
					x: base64_x_Key,
					y: base64_y_Key,
				},
				'ES256',
			);

			//TODO?: add more checks on payload/header?
			const outVerify = await jwtVerify(client['clientSecret'], publicKey);
			if (!outVerify) {
				return undefined;
			}
			return client["id"];

		} catch (e) {
			// Include the "WWW-Authenticate" response header field if the client
			// lacks any authentication information.
			//
			// @see https://tools.ietf.org/html/rfc6750#section-3.1
			if (e instanceof UnauthorizedRequestError) {
				response.set('WWW-Authenticate', 'Bearer realm="Service"');
			} else if (e instanceof InvalidRequestError) {
				response.set('WWW-Authenticate', 'Bearer realm="Service",error="invalid_request"');
			} else if (e instanceof InvalidTokenError) {
				response.set('WWW-Authenticate', 'Bearer realm="Service",error="invalid_token"');
			} else if (e instanceof InsufficientScopeError) {
				response.set('WWW-Authenticate', 'Bearer realm="Service",error="insufficient_scope"');
			}

			if (!(e instanceof OAuthError)) {
				throw new ServerError(e);
			}

			throw e;
		}
	}

	/**
	 * Get the access token from the model.
	 */

	async getAccessToken(token: string) {
		const accessToken = await this.model.getAccessToken(token);

		if (!accessToken) {
			throw new InvalidTokenError('Invalid token: access token is invalid');
		}

		if (!accessToken.user) {
			throw new ServerError('Server error: `getAccessToken()` did not return a `user` object');
		}

		return accessToken;
	}

	/**
	 * Validate access token.
	 */

	validateAccessToken(accessToken: Token) {
		if (!(accessToken.accessTokenExpiresAt instanceof Date)) {
			throw new ServerError('Server error: `accessTokenExpiresAt` must be a Date instance');
		}

		if (accessToken.accessTokenExpiresAt < new Date()) {
			throw new InvalidTokenError('Invalid token: access token has expired');
		}

		return accessToken;
	}

	/**
	 * Verify scope.
	 */

	async verifyScope(scope:string[], resource:string) {
		// see https://openid.github.io/OpenID4VCI/openid-4-verifiable-credential-issuance-wg-draft.html#section-5.1.2
		if (!scope) {
			throw new InsufficientScopeError('Insufficient scope: authorized scope is insufficient');
		}
		if(!resource) {
			throw new Error('Invalid request: needed resource to verify scope');
		}
		//TODO: this should access the /.well-known/openid-credential-issuer
		// and verify that the string in scope is one of the credential_configuration_id
		// NOTE that this should also handle the case of multiple scope values
				// const url = resource + '/.well-known/openid-credential-issuer';
				// const response = await fetch(url, {method: 'GET'});
				// if (!response.ok) {
				// 	throw new Error(`Error! status: ${response.status}`);
				// }

				// const result = await response.json();
		return true;
	}

	/**
	 * Update response.
	 */

	updateResponse(response: Response, accessToken: Token) {
		if (accessToken.scope == null) {
			return;
		}

		if (this.scope && this.addAcceptedScopesHeader) {
			response.set('X-Accepted-OAuth-Scopes', this.scope.join(' '));
		}

		if (this.scope && this.addAuthorizedScopesHeader) {
			response.set('X-OAuth-Scopes', accessToken.scope.join(' '));
		}
	}
}
