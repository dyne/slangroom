<!--
SPDX-FileCopyrightText: 2023-2025 Dyne.org foundation
SPDX-License-Identifier: AGPL-3.0-or-later
-->

# 🚀 Run Slangroom Your Way {#-top}

From terminals to browsers—powerful, portable, and privacy-preserving execution

Slangroom adapts to your environment with multiple deployment options:
<!-- no toc -->
- [⌨️ CLI](#-cli)
	- [🧠 Slangroom-exec](#-slangroom-exec): Execute Slangroom contracts read from `STDIN`
	- [👯 Twinroom](#-twinroom): turn Slangroom contracts into CLI commands
- [🌐 WEB](#-web)
	- [🛝 Online playgorund](#-online-playgorund): Test slangroom contracts instantly on web
	- [🧩 Webcomponent](#-webcomponent): Make your HTML a Dyner place
	- [📜 HTML](#-html): Direclty use slangroom in your html page
- [📡 REST](#-rest)
	- [🪄 Noˑcodeˑroom](#-noˑcodeˑroom): No code REST API server based on Slangroom
	- [😈 Twinroom in daemon mode](#-twinroom-in-daemon-mode): Turn Slangroom contracts into API
- [🐯 JS/TS](#-js-ts)
    - [📚 Library](#-library): Integrates slangroom in your JS/TS project

## ⌨️ CLI {#-cli}

Terminal whisperer? 🦜 Slangroom speaks your language!

### 🧠 Slangroom-exec {#-slangroom-exec}

[Slangroom-exec](https://github.com/dyne/slangroom-exec) is a simple utility that reads from `STDIN` the following content
* conf
* slangroom-contract
* data
* keys
* extra
* context

Each is separated by a newline and encoded in base64 (sounds tricky, but [slexfe](https://github.com/dyne/slangroom-exec?tab=readme-ov-file#-slexfe) is here to help) and outputs the slangroom execution to `STDOUT`.

A simple example using [mise](https://mise.jdx.dev/) to install slangroom-exec and slexfe is the following
```bash
# ⬇️ install slangroom-exec (this also install slexfe)
mise use aqua:dyne/slangroom-exec

# ⚡run it
cat <<EOF | slexfe | slangroom-exec
Prepare 'timestamp': fetch the local timestamp in seconds
Given I have a 'time' named 'timestamp'
Then print the string '😘 Welcome to the Slangroom World 🌈'
Then print the 'timestamp'
EOF
```

[📖 Full documentation](https://github.com/dyne/slangroom-exec?tab=readme-ov-file#slangroom-exec-) |
[🔝 Back to top](#-top)

### 👯 Twinroom {#-twinroom}

[Twinroom](https://github.com/forkbombEu/twinroom) builds on slangroom-exec, letting you turn Slangroom
contracts into CLI commands (and even more!).
Not enough? It let you also:
* run external slangroom contracts dynamically 🧨
* Expose commands as HTTP API endpoints: [daemon mode](#-twinroom-in-daemon-mode) 😈

Some twinroom examples:
```bash
# ⬇️ download the binary
wget https://github.com/forkbombeu/twinroom/releases/latest/download/twinroom -O ~/.local/bin/twinroom && chmod +x ~/.local/bin/twinroom

# 📃 list embedded contracts (that now are commands!)
twinroom test --help
# ⚡ run an embedded contracts
twinroom test hello
# 🧨 run an external contracts
cat << EOF > welcome.slang
Prepare 'timestamp': fetch the local timestamp in seconds
Given I have a 'time' named 'timestamp'
Then print the string '😘 Welcome to the Slangroom World 🌈'
Then print the 'timestamp'
EOF
twinroom $(pwd) welcome
```

[📖 Full documentation](https://github.com/forkbombEu/twinroom?tab=readme-ov-file#twinroom-) |
[🔝 Back to top](#-top)

## 🌐 Web {#-web}

Like Bash, but cuter 💅 And serverless.

### 🛝 Online playgorund {#-online-playgorund}

Test slangroom contracts instantly on the [web playgorund](https://dyne.org/slangroom/playground/)

[🔝 Back to top](#-top)

### 🧩 Webcomponent {#-webcomponent}

How did we build the web playgound? Simply using [dyne components](https://github.com/dyne/components)

[📖 Full documentation](https://dyne.org/components/?path=/docs/welcome--docs) |
[🔝 Back to top](#-top)

### 📜 Simple integration in html file {#-html}

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
                    Prepare 'timestamp': fetch the local timestamp in seconds
                    Given I have a 'time' named 'timestamp'
                    Then print the string '😘 Welcome to the Slangroom World in the Web 🌈'
                    Then print the 'timestamp'
                    `;
                const res = document.getElementById('res');
                slangroom.execute(script)
                .then((r) => {
                    res.innerText = JSON.stringify(r.result);
                });
            });
        </script>
    </body>
</html>
```

[🔝 Back to top](#-top)

## 📡 REST {#-rest}

Your contracts, now RESTing comfortably in an endpoint near you. 🛏

### 🪄 Noˑcodeˑroom {#-noˑcodeˑroom}

[Noˑcodeˑroom](https://github.com/ForkbombEu/ncr) lets you execute Slangroom smart contracts
via RESTful API calls, turning natural language logic into live endpoints—no traditional code needed.
Its strength lies in flexible configuration: you can set it up using command-line options or
environment variables, and control the behavior of each API endpoint through a simple metadata file.

First steps with ncr:

```bash
# download the binary (only for linux at the moment)
wget https://github.com/forkbombeu/ncr/releases/latest/download/ncr -O ~/.local/bin/ncr && chmod +x ~/.local/bin/ncr

# checkout this repo
git clone https://github.com/forkbombeu/ncr

# run the server on port 3000 with the example folders
ncr -p 3000 -z ./ncr/tests/fixtures --public-directory ./ncr/public
```

[📖 Full documentation](https://github.com/ForkbombEu/ncr?tab=readme-ov-file#no%CB%91code%CB%91room-) |
[🔝 Back to top](#-top)

### 😈 Twinroom in daemon mode {#-twinroom-in-daemon-mode}

[Twinroom](https://github.com/forkbombEu/twinroom) builds on slangroom-exec, letting you turn Slangroom
contracts into [CLI commands](#-twinroom) or HTTP API endpoints.

```bash
# ⬇️ download the binary
wget https://github.com/forkbombeu/twinroom/releases/latest/download/twinroom -O ~/.local/bin/twinroom && chmod +x ~/.local/bin/twinroom

# 😈 start the daemon mode
twinroom --daemon
# visit http://localhost:3000/slang for the swagger documentation ot just test it
curl -X GET http://localhost:3000/test/hello
```

[📖 Full documentation](https://github.com/forkbombEu/twinroom?tab=readme-ov-file#twinroom-) |
[🔝 Back to top](#-top)

## 🐯 JS/TS {#-js-ts}

Write your will in words, and watch JavaScript make it real. ✍

### 📚 Library {#-library}

```js
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

[🔝 Back to top](#-top)
