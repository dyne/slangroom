import { Plugin } from '@slangroom/core';
import _ from 'lodash';

const p = new Plugin()

class HelperError extends Error {
    constructor(e: Error) {
        super(e.message)
        this.name = 'Slangroom @slangroom/helper Error'
    }
}

export const get = p.new(['object', 'path'], 'manipulate and get', async (ctx) => {
    const object = ctx.fetch('object');
    const path = ctx.fetch('path');
    try {
        return ctx.pass(_.get(object as any, path as string));
    } catch (e) {
        throw new HelperError(e);
    }
});

export const set = p.new(['object', 'path', 'value'], 'manipulate and set', async (ctx) => {
    const object = ctx.fetch('object');
    const path = ctx.fetch('path');
    const value = ctx.fetch('value');
    try {
        return ctx.pass(_.set(object as any, path as string, value));
    } catch (e) {
        throw new HelperError(e);
    }
});

export const merge = p.new(['object', 'sources'], 'manipulate and merge', async (ctx) => {
    const object = ctx.fetch('object');
    const sources = ctx.fetch('sources');
    try {
        return ctx.pass(_.merge(object as any, ...sources as any[]));
    } catch (e) {
        throw new HelperError(e);
    }
});

export const omit = p.new(['object', 'paths'], 'manipulate and omit', async (ctx) => {
    const object = ctx.fetch('object');
    const paths = ctx.fetch('paths');
    try {
        return ctx.pass(_.omit(object as any, paths as any[]));
    } catch (e) {
        throw new HelperError(e);
    }
});

export const concat = p.new(['array', 'values'], 'manipulate and concat', async (ctx) => {
    const array = ctx.fetch('array');
    const values = ctx.fetch('values');
    try {
        return ctx.pass(_.concat(array as any[], ...values as any[]));
    } catch (e) {
        throw new HelperError(e);
    }
});

export const compact = p.new(['array'], 'manipulate and compact', async (ctx) => {
    const array = ctx.fetch('array');
    try {
        return ctx.pass(_.compact(array as any[]));
    } catch (e) {
        throw new HelperError(e);
    }
});

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


