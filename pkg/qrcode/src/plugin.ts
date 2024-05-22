// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import QrCode from 'qrcode'
// read the version from the package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('@slangroom/qrcode/package.json');

export class QrCodeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/qrcode@' + packageJson.version + ' Error';
	}
}

const p = new Plugin()

/**
 * @internal
 */
export const generateQr = p.new(['text'], 'create qr code', async (ctx) => {
    const textToEncode = ctx.fetch('text');
    if (typeof textToEncode !== 'string') return ctx.fail(new QrCodeError("text must be string"));

    try {
        const res = await QrCode.toDataURL(textToEncode, {
        errorCorrectionLevel: 'L',
        type: 'image/png'
        });
        return ctx.pass(res);
    } catch (e) {
        return ctx.fail(new QrCodeError(e.message));
    }
})

export const qrcode = p


