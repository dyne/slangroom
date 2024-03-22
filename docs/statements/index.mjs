import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {markdownTable} from "markdown-table";
// slangroom
import {Slangroom} from "@slangroom/core";
// packages
import {ethereum} from "@slangroom/ethereum";
import {fs as sl_fs} from "@slangroom/fs";
import {git} from "@slangroom/git";
import {helpers} from "@slangroom/helpers";
import {http} from "@slangroom/http";
import {oauth} from "@slangroom/oauth";
import {pocketbase} from "@slangroom/pocketbase";
import {qrcode} from "@slangroom/qrcode";
import {redis} from "@slangroom/redis";
import {shell} from "@slangroom/shell";
import {timestamp} from "@slangroom/timestamp";
import {wallet} from "@slangroom/wallet";
import {zencode} from "@slangroom/zencode";

const IGNORED_PKG = ['browser', 'core', 'deps', 'ignored', 'json-schema', 'shared']

const __dirname = dirname(fileURLToPath(import.meta.url));

// utility to check that all packages are documented
const pkgPath = path.resolve(__dirname, "../../pkg");
const pkgNames = fs.readdirSync(pkgPath)
IGNORED_PKG.forEach((ignoredPkg) => {
	const index = pkgNames.indexOf(ignoredPkg);
	pkgNames.splice(index, 1);
});

const generateTable = (plugin, name) => {
	const index = pkgNames.indexOf(name);
	pkgNames.splice(index, 1);
	const table = [['open/connect', 'params', 'phrase']];
	const p = new Slangroom(plugin).getPlugin()
	p.forEach(([k]) => {
		table.push([k.openconnect, k.params, k.phrase])
	});
	const mdTable = markdownTable(table)
	mdDocumentation = mdDocumentation.concat(`## ${name} plugin\n${mdTable}\n\n`)
}

let mdDocumentation = "# Tables of all slangroom statements\n\n";

[
    [ethereum, 'ethereum'],
	[sl_fs, 'fs'],
	[git, 'git'],
	[helpers, 'helpers'],
	[http, 'http'],
	[oauth, 'oauth'],
	[pocketbase, 'pocketbase'],
	[qrcode, 'qrcode'],
	[redis, 'redis'],
	[shell, 'shell'],
	[timestamp, 'timestamp'],
	[wallet, 'wallet'],
	[zencode, 'zencode']
].map(x => generateTable(x[0], x[1]))

if (pkgNames.length != 0) {
	throw new Error(`Not all packages are documented, missing: ${pkgNames}`)
}
const outPath = path.resolve(__dirname, "./") + '/phraseTable.md';
const content = fs.readFileSync(outPath);

if (process.argv[2] === 'ci' && content != mdDocumentation) {
	throw new Error(`Documentation is not up to date with last modifications`)
}

fs.writeFileSync(outPath, mdDocumentation);
