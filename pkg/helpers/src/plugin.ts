import { Plugin } from '@slangroom/core';
import _ from 'lodash';

const p = new Plugin()

class HelperError extends Error {
    constructor(e: Error) {
        super(e.message)
        this.name = 'Slangroom @slangroom/helper Error'
    }
}

// export const assign = p.new(['target', 'source'], 'manipulate and assign', async (ctx) => {
//     const target = ctx.fetch('target');
//     const source = ctx.fetch('source');
//     try {
//         return ctx.pass(_.assign(target as {}, source as {}));
//     } catch (e) {
//         throw new HelperError(e);
//     }
// });

// export const omit = p.new(['object', 'properties'], 'manipulate and omit', async (ctx) => {
//     const properties = ctx.fetch('properties');
//     const obj = ctx.fetch('object');
//     try {
//         return ctx.pass(_.omit(obj as {}, properties as string[]));
//     } catch (e) {
//         throw new HelperError(e);
//     }
// });

export const pick = p.new(['object', 'properties'], 'manipulate and pick', async (ctx) => {
    const properties = ctx.fetch('properties') as string[] | string;
    const obj = ctx.fetch('object') as {};
    try {
        const manipulated = _.pick(obj, properties);
        if (Object.keys(manipulated).length === 0) {
            throw new Error(`MANIPULATION ERRROR: \nNone of the properties \n\n ${JSON.stringify(properties)} \n\n exist in the object: \n\n ${JSON.stringify(obj, null, 3)}`);
        }
        return ctx.pass(manipulated);
    } catch (e) {
        throw new HelperError(e);
    }
});

export const helpers = p


