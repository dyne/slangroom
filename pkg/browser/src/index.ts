// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { qrcode } from '@slangroom/qrcode';
import { http } from '@slangroom/http';
import { pocketbase } from '@slangroom/pocketbase';
import { helpers } from '@slangroom/helpers';
import {JSONSchema} from '@slangroom/json-schema'
const slangroom = new Slangroom([http, qrcode, JSONSchema, pocketbase, helpers]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).slangroom = slangroom; // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

console.log('🎉 Slangroom is ready');
