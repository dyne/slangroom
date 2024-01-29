import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { oauth } from '@slangroom/oauth';

test('create token', async (t) => {
	const scriptCreate = `
Rule unknown ignore

Given I send body 'body' and send headers 'headers' and generate access token and output into 'accessToken_jwt'

Given I have a 'string dictionary' named 'accessToken_jwt'

Then print data
`;
	const slangroom = new Slangroom(oauth);
	const res = await slangroom.execute(scriptCreate, {
		keys: {
			body: "grant_type=password&username=thomseddon&password=nightworld&redirect_uri=https%3A%2F%2FWallet.example.org%2Fcb",
			headers: {
				"Authorization": "Basic dGhvbTpuaWdodHdvcmxk",
				"content-length": 42,
				"Content-Type": "application/x-www-form-urlencoded"
			},
		},
	});
	console.log(res.result['accessToken_jwt']);
	t.is(res.result['accessToken_jwt'],{});

});
