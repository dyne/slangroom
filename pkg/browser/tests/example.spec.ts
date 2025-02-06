// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect } from '@playwright/test';

test('check results of slangroom', async ({ page }) => {
	await page.goto('http://localhost:8080/');

	// Expects page to have a heading with the name of Installation.
	await expect(page.locator('#test1')).toContainText(
		'did:dyne:sandbox.test:pEn78CGNEKvMR7DJQ1yvUVUpAHKzsBz45mQw3zD2js9',
	);

	await expect(page.locator('#test-json-schema')).toContainText(
		"{\"out\":{\"errors\":[]}}",
	);

	await expect(page.locator('#test-pocketbase')).toContainText(
		"\"output\":{\"description\":\"<p>test description of org</p>\"}}"
	);
	await expect(page.locator('#test-pocketbase-2')).toContainText(
		"{\"output\":{\"name\":\"test organization\"}}"
	);

	await expect(page.locator('#test-pocketbase-3')).toContainText(
		"{\"output\":[\"token_refreshed\"]}"
	);
});

test('check @slangroom/location', async ({ browser, page }) => {
	await page.goto('http://localhost:8080/location');

	await page.click('button#getLocationButton');
	await expect(page.locator('#getLocation')).toContainText(
		'{"location":{"hash":"","host":"localhost:8080","hostname":"localhost","href":"http://localhost:8080/location","pathname":"/location","port":"8080","protocol":"http:","search":""}}',
	);

	// replace the current location
	await page.click('button#replaceButton');
	await expect(page).toHaveURL('https://example.com');

	// assign the current location
	await page.goto('http://localhost:8080/location');
	await page.click('button#assignButton');
	await expect(page).toHaveURL('https://example.com');

	// redirect to the url
	await page.goto('http://localhost:8080/location');
	await page.click('button#redirectButton');
	await expect(page).toHaveURL('https://example.com');

	// go back
	await page.goto('http://localhost:8080/location');
	await page.click('button#goBackButton');
	await expect(page).toHaveURL('https://example.com');

	// go forward
	await page.goto('http://localhost:8080/location');
	await page.goBack();
	await page.goBack();
	await page.click('button#goForwardButton');
	await expect(page).toHaveURL('https://example.com');

	// new window
	await page.goto('http://localhost:8080/location');
	const context = page.context();
	const [newPage] = await Promise.all([
		context.waitForEvent('page'),
		page.click('button#newWindowButton')
	]);
	await newPage.waitForLoadState();
	await expect(newPage).toHaveURL('https://example.com');
	await newPage.close();

	// history lenght
	await page.goto('http://localhost:8080/location');
	await page.click('button#getHistoryLengthButton');
	await expect(page.locator('#getHistoryLength')).toContainText(/{"history_length":(6|7)}/);

	// go to history index
	await page.click('button#goToHistoryButton');
	await expect(page).toHaveURL('https://example.com');
});
