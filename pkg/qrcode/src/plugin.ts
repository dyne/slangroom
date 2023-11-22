import { Plugin } from '@slangroom/core';
import QRCode from 'qrcode'


const p = new Plugin()

/**
 * @internal
 */
export const generateQr = p.new(['text'],'create qr code', async (ctx) => {
    const textToEncode = ctx.fetch('text') as string
    console.log(textToEncode)
    
    return await QRCode.toDataURL(textToEncode, {
        errorCorrectionLevel: 'L',
        type: 'image/png'
    })
    .then(url => ctx.pass(url))
    .catch(err => ({ok:false, error: err}))
})

export const qrcode = p 


