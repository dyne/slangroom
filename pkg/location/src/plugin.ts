// read the version from the package.json
import packageJson from '@slangroom/location/package.json' with { type: 'json' };
import { Plugin, PluginContext } from '@slangroom/core';

export const version = packageJson.version;

export class LocationBaseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'Slangroom @slangroom/location@' + packageJson.version + ' Error';
	}
}

const p = new Plugin();

 const isBrowser = (ctx:PluginContext)=>{
    if (window === undefined) {
        return ctx.fail(new LocationBaseError('You must be in a browser environment to use this plugin'));
    }
    return undefined
}

const isUrlAString = (ctx:PluginContext, url:unknown)=>{
    if (typeof url !== 'string') {
        return ctx.fail(new LocationBaseError('url must be a string'));
    }
    return undefined
}


/**
 * @internal
 */
export const getLocation = p.new('connect', 'get the current location', (ctx) => {
    isBrowser(ctx)
	const location = window.location
	return ctx.pass({
		href: location.href,
		protocol: location.protocol,
		host: location.host,
		hostname: location.hostname,
		port: location.port,
		pathname: location.pathname,
		search: location.search,
		hash: location.hash
	})
});

/**
 * @internal
 */
export const getHref = p.new('connect', 'get the current location href', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.href)
});

/**
 * @internal
 */
export const getProtocol = p.new('connect', 'get the current location protocol', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.protocol)
});

/**
 * @internal
 */
export const getHost = p.new('connect', 'get the current location host', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.host)
});

/**
 * @internal
 */
export const getHostname = p.new('connect', 'get the current location hostname', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.hostname)
});

/**
 * @internal
 */
export const getPort = p.new('connect', 'get the current location port', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.port)
});

/**
 * @internal
 */
export const getPathname = p.new('connect', 'get the current location pathname', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.pathname)
});

/**
 * @internal
 */
export const getSearch = p.new('connect', 'get the current location search params', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.search)
});

/**
 * @internal
 */
export const getHash = p.new('connect', 'get the current location hash', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.location.hash)
});

/**
 * @internal
 */
export const reload = p.new('connect', 'reload the current page', (ctx) => {
    isBrowser(ctx)
    window.location.reload()
    return ctx.pass('reload');
});

/**
 * @internal
 */
export const replace = p.new(['url'], 'replace the current location', (ctx) => {
    isBrowser(ctx)
    const url = ctx.get('url') as string;
    isUrlAString(ctx,url)
    window.location.replace(url)
    return ctx.pass('replace');
});

/**
 * @internal
 */
export const assign = p.new(['url'], 'assign the current location', (ctx) => {
    isBrowser(ctx)
    const url = ctx.get('url') as string;
    isUrlAString(ctx,url)
    window.location.assign(url)
    return ctx.pass('assign');
});

/**
 * @internal
 */
export const redirectToUrl = p.new(['url'], 'redirect to the url', (ctx) => {
    isBrowser(ctx)
    const url = ctx.get('url') as string;
    isUrlAString(ctx,url)
    window.location.href = url
    return ctx.pass('redirect');
});

/**
 * @internal
 */
export const goBack = p.new(['url'], 'go back in history', (ctx) => {
    isBrowser(ctx)
    window.history.back()
    return ctx.pass('back');
});

/**
 * @internal
 */
export const goForward = p.new(['url'], 'go forward in history', (ctx) => {
    isBrowser(ctx)
    window.history.forward()
    return ctx.pass('forward');
});

/**
 * @internal
 */
export const go = p.new(['index'], 'go to a specific page in history', (ctx) => {
    isBrowser(ctx)
    const index = ctx.get('index')
    if (typeof index !== 'number') {
        return ctx.fail(new LocationBaseError('index must be a number'))
    }
    window.history.go(index)
    return ctx.pass('go');
});

/**
 * @internal
 */
export const length = p.new('connect', 'get the history length', (ctx) => {
    isBrowser(ctx)
    return ctx.pass(window.history.length)
});



/**
 * @internal
 */
export const openWindow = p.new(['url'], 'open the url in a new window', (ctx) => {
    isBrowser(ctx)
    const url = ctx.get('url') as string;
    isUrlAString(ctx,url)
    window.open(url, '_blank')
    return ctx.pass('open');
});

export const location = p