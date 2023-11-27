import { Plugin } from '@slangroom/core';
import QrCode from 'qrcode'

const p = new Plugin()

/**
 * @internal
 */
export const generateQr = p.new(['text'], 'create qr code', async (ctx) => {
    const textToEncode = ctx.fetch('text')
    if (typeof textToEncode !== 'string') return ctx.fail("text must be string")
    
    try {
        const res = await QrCode.toDataURL(textToEncode, {
        errorCorrectionLevel: 'L',
        type: 'image/png'
        })
        return ctx.pass(res)
    } catch (e) {
        return ctx.fail(e)
    }
})

export const qrcode = p 


