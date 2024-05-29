// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin } from '@slangroom/core';
import _ from 'lodash';
// read the version from the package.json
import packageJson from '@slangroom/helpers/package.json' with { type: 'json' };

const p = new Plugin()

class HelperError extends Error {
    constructor(e: Error) {
        super(e.message)
        this.name = 'Slangroom @slangroom/helper@' + packageJson.version + ' Error'
    }
}

export const get = p.new(['object', 'path'], 'manipulate and get', async (ctx) => {
    const object = ctx.fetch('object');
    const path = ctx.fetch('path');
    try {
        return ctx.pass(_.get(object as any, path as string));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const set = p.new(['object', 'path', 'value'], 'manipulate and set', async (ctx) => {
    const object = ctx.fetch('object');
    const path = ctx.fetch('path');
    const value = ctx.fetch('value');
    try {
        return ctx.pass(_.set(object as any, path as string, value));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const merge = p.new(['object', 'sources'], 'manipulate and merge', async (ctx) => {
    const object = ctx.fetch('object');
    const sources = ctx.fetch('sources');
    try {
        return ctx.pass(_.merge(object as any, ...sources as any[]));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const omit = p.new(['object', 'paths'], 'manipulate and omit', async (ctx) => {
    const object = ctx.fetch('object');
    const paths = ctx.fetch('paths');
    try {
        return ctx.pass(_.omit(object as any, paths as any[]));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const concat = p.new(['array', 'values'], 'manipulate and concat', async (ctx) => {
    const array = ctx.fetch('array');
    const values = ctx.fetch('values');
    try {
        return ctx.pass(_.concat(array as any[], ...values as any[]));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const compact = p.new(['array'], 'manipulate and compact', async (ctx) => {
    const array = ctx.fetch('array');
    try {
        return ctx.pass(_.compact(array as any[]));
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

export const pick = p.new(['object', 'properties'], 'manipulate and pick', async (ctx) => {
    const properties = ctx.fetch('properties') as string[] | string;
    const obj = ctx.fetch('object') as {};
    try {
        const manipulated = _.pick(obj, properties);
        if (Object.keys(manipulated).length === 0) {
            return ctx.fail(new HelperError(new Error(`MANIPULATION ERRROR:\nNone of the properties\n\n ${JSON.stringify(properties)}\n\n exist in the object:\n\n ${JSON.stringify(obj, null, 3)}`)));
        }
        return ctx.pass(manipulated);
    } catch (e) {
        return ctx.fail(new HelperError(e));
    }
});

// must be followe by "and output into 'variable_to_eliminate'"
export const del = p.new('manipulate and delete', async (ctx) => {
    return ctx.pass(null)
});

export const helpers = p


