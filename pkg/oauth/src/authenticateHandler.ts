import {
	Request,
	Response,
	Token,
	InvalidArgumentError,
	ServerOptions,
	InsufficientScopeError,
	InvalidRequestError,
	InvalidTokenError,
	OAuthError,
	ServerError,
	UnauthorizedRequestError,
	AuthorizationCodeModel,
	ClientCredentialsModel,
	ExtensionModel,
	PasswordModel,
	RefreshTokenModel,
} from '@node-oauth/oauth2-server';
import { importJWK, jwtVerify } from 'jose';
import bs58 from 'bs58';
import { InMemoryCache } from '@slangroom/oauth';

export class AuthenticateHandler {
	addAcceptedScopesHeader: boolean | undefined;
	addAuthorizedScopesHeader: boolean | undefined;
	allowBearerTokensInQueryString: boolean | undefined;
	model: InMemoryCache | AuthorizationCodeModel | ClientCredentialsModel | RefreshTokenModel | PasswordModel | ExtensionModel;
	scope: string[] | undefined;
	authenticationUrl: string;

	constructor(options: ServerOptions, authentication_url: string) {

		this.authenticationUrl = authentication_url || 'https://did.dyne.org/dids/';

		options = options || {};

		if (!options.model) {
			throw new InvalidArgumentError('Missing parameter: `model`');
		}

		if (!options.model.getAccessToken) {
			throw new InvalidArgumentError(
				'Invalid argument: model does not implement `getAccessToken()`',
			);
		}

		if (options.scope && undefined === options.addAcceptedScopesHeader) {
			throw new InvalidArgumentError('Missing parameter: `addAcceptedScopesHeader`');
		}

		if (options.scope && undefined === options.addAuthorizedScopesHeader) {
			throw new InvalidArgumentError('Missing parameter: `addAuthorizedScopesHeader`');
		}
		//	console.log(options.scope && !options.model.verifyScope) = undefined but pass the check
		if (options.scope && !options.model.verifyScope) {
			throw new InvalidArgumentError(
				'Invalid argument: model does not implement `verifyScope()`',
			);
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
			throw new InvalidArgumentError(
				'Invalid argument: `request` must be an instance of Request',
			);
		}

		if (!(response instanceof Response)) {
			throw new InvalidArgumentError(
				'Invalid argument: `response` must be an instance of Response',
			);
		}

		try {
			const cl_id = request.body.client_id;
			const cl_sec = request.body.clientSecret;
			const client = await this.model.getClient(cl_id, cl_sec);
			if (!client) {
				throw new Error('Invalid Client');
			}

			const scope = request.body.scope;
			if(scope) {
				const resource = request.body.resource;
				if (!resource) throw new Error('Request is missing resource parameter');

				const valid_scope = await this.verifyScope(scope, resource);
				if (!valid_scope) throw new Error('Given scope is not valid');
			}

			const auth_url = this.authenticationUrl;
			const url = auth_url + cl_id;

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Fetch to url ${url} failed with error status: ${response.status}`);
			}

			const result = await response.json();

			const base58Key = result.didDocument.verificationMethod.find((value: any) => value.type == 'EcdsaSecp256r1VerificationKey').publicKeyBase58;
			const uint8Key = bs58.decode(base58Key);
			const x_base64Key = Buffer.from(uint8Key.buffer.slice(0, 32)).toString('base64url');
			const y_base64Key = Buffer.from(uint8Key.buffer.slice(32)).toString('base64url');

			const publicKey = await importJWK(
				{
					crv: 'P-256',
					kty: 'EC',
					x: x_base64Key,
					y: y_base64Key,
				},
				'ES256',
			);

			//TODO?: add more checks on payload/header?
			const outVerify = await jwtVerify(client['clientSecret'], publicKey);
			if (!outVerify) {
				return undefined;
			}
			return client['id'];
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
				response.set(
					'WWW-Authenticate',
					'Bearer realm="Service",error="insufficient_scope"',
				);
			}

			if (!(e instanceof OAuthError)) {
				throw new ServerError(e);
			}

			throw e;
		}
	}

	/**
	 * Verify scope.
	 */

	// for reference see: https://openid.github.io/OpenID4VCI/openid-4-verifiable-credential-issuance-wg-draft.html#section-5.1.2
	async verifyScope(scope: string[], resource: string) {
		if (!scope) {
			throw new InsufficientScopeError(
				'Insufficient scope: authorized scope is insufficient',
			);
		}
		if (!resource) {
			throw new Error('Invalid request: needed resource to verify scope');
		}

		const url = resource + '/.well-known/openid-credential-issuer';
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Fetch to url ${url} failed with error status: ${response.status}`);
		}
		const result = await response.json();
		const credentials_supported = result.credential_configurations_supported;
		var valid_credentials = [];
		for (var key in credentials_supported) {
			const type_arr = credentials_supported[key].credential_definition.type;
			if (
				type_arr.find((id: any) => {
					return id === scope;
				}) != undefined
			) {
				valid_credentials.push(scope);
				break;
			}
		}

		if (valid_credentials.length > 0) return true;
		else return false;
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
