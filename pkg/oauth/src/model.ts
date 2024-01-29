import { PasswordModel, Client, User, Token, Falsey } from "@node-oauth/oauth2-server";
import { SignJWT, generateKeyPair } from 'jose';
import { randomBytes } from 'crypto';


export class InMemoryCache implements PasswordModel {
	clients: Client[];
	tokens: Token[];
	users: User[];

	/**
	 * Constructor.
	 */
	constructor() {
		this.clients = [{ id: 'thom', clientSecret: 'nightworld', grants: ["password"], redirectUris: ['https://Wallet.example.org/cb'] }];
		this.tokens = [];
		this.users = [{ id: '123', username: 'thomseddon', password: 'nightworld' }];
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
		var clients = this.clients.filter(function (client: Client) {
			return client.id === clientId && client['clientSecret'] === clientSecret;
		});
		return Promise.resolve(clients[0]);
	};

	/**
	 * Save token.
	 */

	saveToken(token: Token, client: Client, user: User): Promise<Token | Falsey> {
		const tokenSaved: Token = {
			accessToken: token.accessToken,
			accessTokenExpiresAt: token.accessTokenExpiresAt,
			clientId: client.id,
			refreshToken: token.refreshToken,
			refreshTokenExpiresAt: token.refreshTokenExpiresAt,
			userId: user['id'],
			client: client,
			user: user
		}
		this.tokens.push(tokenSaved);
		const clients = this.clients.filter(function (client) {
			return client.id === tokenSaved['clientId']
		});
		if (clients[0]) tokenSaved.client = clients[0];
		tokenSaved.user = user;
		return Promise.resolve(tokenSaved);
	};

	/**
	 * Get user.
	 */

	getUser(username: string, password: string): Promise<User | Falsey> {
		var users = this.users.filter(function (user) {
			return user['username'] === username && user['password'] === password;
		});

		return Promise.resolve(users[0]);
	};

	/**
	 * Generate access token.
	 */

	async generateAccessToken(client: Client, user: User, scope?: string[]): Promise<string> {

		if(user && scope) console.log('11');

		const clientId = client.id;
		const keyPair = await generateKeyPair('ES256');

		const token = new SignJWT({ sub: randomBytes(20).toString('hex') })
			.setProtectedHeader({ alg: 'ES256', pubKey: keyPair.publicKey })
			.setIssuedAt(Date.now())
			.setIssuer('https://valid.issuer.url')
			.setAudience(clientId)
			.setExpirationTime('1h')
			.sign(keyPair.privateKey);
		return token;
	};

}
