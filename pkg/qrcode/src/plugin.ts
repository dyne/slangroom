import { Plugin } from '@slangroom/core';
import QRCode from 'qrcode'


const p = new Plugin()

/**
 * @internal
 */
export const generateQr = p.new(['text'],'create qr code', async (ctx) => {
    const textToEncode = ctx.fetch('text')
    if (typeof textToEncode !== 'string') return {ok:false, error: "you should provide a text to encode"}
    
    return await QRCode.toDataURL(textToEncode, {
        errorCorrectionLevel: 'L',
        type: 'image/png'
    })
    .then(url => ctx.pass(url))
    .catch(err => ({ok:false, error: err}))
})

export const qrcode = p 


