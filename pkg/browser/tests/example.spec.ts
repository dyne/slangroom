import { test, expect } from '@playwright/test';

test('check results of slangroom', async ({ page }) => {
	await page.goto('http://localhost:8080/');

	// Expects page to have a heading with the name of Installation.
	await expect(page.locator('#test1')).toContainText(
		'did:dyne:sandbox.test:pEn78CGNEKvMR7DJQ1yvUVUpAHKzsBz45mQw3zD2js9',
	);
});
