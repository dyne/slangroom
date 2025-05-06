<!--
SPDX-FileCopyrightText: 2023-2025 Dyne.org foundation
SPDX-License-Identifier: AGPL-3.0-or-later
-->

[![REUSE status](https://api.reuse.software/badge/github.com/dyne/slangroom)](https://api.reuse.software/info/github.com/dyne/slangroom)

<div align="center">

# Slangroom <!-- omit in toc -->

### Zencode plugins? Slangroom!</br>Enhance zencode smart–contracts with your slang <!-- omit in toc -->

</div>

<p align="center">
  <a href="https://dyne.org">
    <img src="https://files.dyne.org/software_by_dyne.png" width="170">
  </a>
</p>


---
<br><br>

## ✨ Slangroom features <!-- omit in toc -->

Slangroom is a plugin system to enhance the domain-specific [Zencode language](hhttps://dev.zenroom.org/#/), allowing to define custom operations to new sentences and making it easy to execute fast cryptographic operations on any data structure.

Zencode has a **no-code** approach. It is a domain-specific language (DSL) **similar to human language**. One can process large data structures through complex cryptographic and logical transformations.

Zencode helps developers to **empower people** who know what to do with data: one can write and review business logic and data-sensitive operations **without learning to code**.

Start by reading the [full documentation](https://dyne.org/slangroom/).

***

<div id="toc">

### 🚩 Table of Contents  <!-- omit in toc -->

- [💾 Install](#-install)
- [🎮 Quick start](#-quick-start)
	- [🌐 Usage in the browser](#-usage-in-the-browser)
- [⚡ Build](#-build)
- [📋 Testing](#-testing)
- [🔧 Customize](#-customize)
- [🐛 Troubleshooting \& debugging](#-troubleshooting--debugging)
- [😍 Acknowledgements](#-acknowledgements)
- [👤 Contributing](#-contributing)
- [💼 License](#-license)
</div>

***
## 💾 Install

To use slangroom in your project you must install the `@slangroom/core` package and then all the plugins that you like:

```sh
pnpm add @slangroom/core
# and then install the plugin that you need, here we install all of them
pnpm add @slangroom/db @slangroom/ethereum @slangroom/fs @slangroom/git @slangroom/helpers @slangroom/http @slangroom/json-schema @slangroom/oauth @slangroom/pocketbase @slangroom/qrcode @slangroom/rdf @slangroom/redis @slangroom/shell @slangroom/timestamp @slangroom/wallet @slangroom/zencode
```


**[🔝 back to top](#toc)**

***
## 🎮 Quick start

After having installed the core plugin along with the other plugins that you need (here wew continuer with all the plugins) you can
use it in your code in the following way:

```ts
import { Slangroom } from '@slangroom/core';
import { db } from '@slangroom/db';
import { ethereum } from '@slangroom/ethereum';
import { fs } from '@slangroom/fs';
import { git } from '@slangroom/git';
import { helpers } from '@slangroom/helpers';
import { http } from '@slangroom/http';
import { JSONSchema } from '@slangroom/json-schema';
import { oauth } from '@slangroom/oauth';
import { pocketbase } from '@slangroom/pocketbase';
import { qrcode } from '@slangroom/qrcode';
import { rdf } from '@slangroom/rdf';
import { redis } from '@slangroom/redis';
import { shell } from '@slangroom/shell';
import { timestamp } from '@slangroom/timestamp';
import { wallet } from '@slangroom/wallet';
import { zencode } from '@slangroom/zencode';

const SLANGROOM_PLUGINS = [
	db,
	ethereum,
	fs,
	git,
	helpers,
	http,
	JSONSchema,
	oauth,
	pocketbase,
	qrcode,
	rdf,
	redis,
	shell,
	timestamp,
	wallet,
	zencode
];

const slang = new Slangroom(SLANGROOM_PLUGINS);

// slangroom contract that you want to run
// here we simply take the timestamp in seconds
const script = `Rule unknown ignore
Given I fetch the local timestamp in seconds and output into 'timestamp'
Given I have a 'time' named 'timestamp'
Then print the 'timestamp'
`;
const data = {};
const keys = {};

const res = await slangroom.execute(script, { data, keys })
```

If you do not wwant to integrate slangroom in your code but wwant to use it, you can simply use:
* [ncr](https://github.com/forkbombEu/ncr): No code REST API server based on slangroom
* [slangroom-exec](https://github.com/dyne/slangroom-exec): CLI tool to run slangroom contracts (offers also go bindings)
* [twinroom](https://github.com/forkbombEu/twinroom): Create your own CLI tool that under the hoods run slangroom contracts.

### 🌐 Usage in the browser

Slangroom can also be directly used in the browser thorugh the plugin @slangroom/browser. This plugin at the moment contains only a subsets of plugin that are:
* [@slangroom/fs](https://dyne.org/slangroom/examples/#fs-plugin-examples)
* [@slangroom/git](https://dyne.org/slangroom/examples/#git-plugin-examples)
* [@slangroom/helpers](https://dyne.org/slangroom/examples/#helpers-plugin-examples)
* [@slangroom/http](https://dyne.org/slangroom/examples/#http-plugin-examples)
* [@slangroom/json-schema](https://dyne.org/slangroom/examples/#json-schema-plugin-examples)
* [@slangroom/location](https://dyne.org/slangroom/examples/#location-plugin-examples)
* [@slangroom/pocketbase](https://dyne.org/slangroom/examples/#pocketbase-plugin-examples)
* [@slangroom/qrcode](https://dyne.org/slangroom/examples/#qrcode-plugin-examples)
* [@slangroom/timestamp](https://dyne.org/slangroom/examples/#timestamp-plugin-examples)

A minimal example is:

```html
<html>
    <head>
        <script type="module" id="slangroom-loader" src="https://cdn.jsdelivr.net/npm/@slangroom/browser"></script>
    </head>
    <body>
        <div id="res"></div>
        <script>
            document.getElementById('slangroom-loader').addEventListener('load', () => {
                const script = `
                    Rule unknown ignore
                    Given I fetch the local timestamp in seconds and output into 'timestamp'
                    Given I have a 'time' named 'timestamp'
                    Then print the 'timestamp'
                    `;
                const res = document.getElementById('res');
                slangroom.execute(script, {
                    data: {
                        foo: 'bar',
                        did_url: 'https://did.dyne.org/dids/did:dyne:sandbox.test:pEn78CGNEKvMR7DJQ1yvUVUpAHKzsBz45mQw3zD2js9',
                    },
                })
                .then((r) => {
                    res.innerText = JSON.stringify(r.result);
                });
            });
        </script>
    </body>
</html>
```

**[🔝 back to top](#toc)**

***
## ⚡ Build

To build slangroom locally you need:
* `pnpm@9`
* `node@^20.10.0` or `node@22`

both of this dependencies can be install with [mise](https://mise.jdx.dev/) by simply running `mise install` in the root of this repository. So the steps to build slangroom are:

```sh
# clone it
git clone https://github.com/dyne/slangroom
cd slangroom

# if you want to handle node and pnpm deps with mise now run: mise install

# install slangroom dependencies
pnpm i
# build slangroom
pnpm build
```

**[🔝 back to top](#toc)**

***
## 📋 Testing

In order to test slangroom you will need to:
* have a redis server running on your machine, it usually can be started with:
	```sh
	sudo systemctl start redis.service
	```
	This is needed to test the redis plugin.
* start a local pocketbase instance:
	```sh
	./slangroom/pkg/pocketbase/test/pocketbase serve
	```
	This is needed to test the pocketbase plugin.
* start oauth microservices:
	```sh
	./slangroom/pkg/oauth/test/start_microservices.sh setup
	```
	This is needed to test the oauth plugin.

After that the above services are started the tests can be launched with
```sh
# install dependencies
pnpm i
# build and run tests
pnpm t
```
If you want to test only a particular plugin you can do it with
```sh
# install dependencies
pnpm i
# build
pnpm build
# test (subistitute timestamp with the plugin you want to test)
pnpm -F @slangroom/timestamp exec ava --verbose build/esm/test
```

**[🔝 back to top](#toc)**

***
## 🔧 Customize

To write new plugins and other technical documentation  head your browser to
[https://dyne.org/slangroom/](https://dyne.org/slangroom/)


**[🔝 back to top](#toc)**

***
## 🐛 Troubleshooting & debugging

Availabe bugs are reported via [GitHub issues](https://github.com/dyne/slangroom/issues).

**[🔝 back to top](#toc)**

***
## 😍 Acknowledgements

<img alt="software by Dyne.org" src="https://files.dyne.org/software_by_dyne.png" width="150" />

Copyleft 🄯 2023—2025 by [Dyne.org](https://www.dyne.org) foundation, Amsterdam.

The grammar package has been created starting from [CodeMirror 6 language package template](https://github.com/codemirror/lang-example).

**[🔝 back to top](#toc)**

***
## 👤 Contributing

Please first take a look at the [Dyne.org - Contributor License Agreement](CONTRIBUTING.md) then

1.  🔀 [FORK IT](../../fork)
2.  Create your feature branch `git checkout -b feature/branch`
3.  Commit your changes `git commit -am 'Add some fooBar'`
4.  Push to the branch `git push origin feature/branch`
5.  Create a new Pull Request `gh pr create -f`
6.  🙏 Thank you


**[🔝 back to top](#toc)**

***
## 💼 License
    Slangroom - the missing plugin system for Zencode
    Copyleft 🄯 2023-2025 Dyne.org foundation, Amsterdam

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**[🔝 back to top](#toc)**
