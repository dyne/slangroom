/**
 * This file is the entrypoint of browser builds.
 * The code executes when loaded in a browser.
 */
import { tokenize } from './main';

declare global {
	interface Window {
		tokenize: typeof tokenize;
	}
}

window.tokenize = tokenize;

console.log(
	'Method "tokenize" was added to the window object. You can try it yourself by just entering "tokenize(contract)"'
);
