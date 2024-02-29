import { Plugin } from '@slangroom/core';

const p = new Plugin();

export const milliseconds = p.new('fetch the local timestamp in milliseconds', async (ctx) => {
	const t = new Date().getTime();
	return ctx.pass(t.toString());
});

export const seconds = p.new('fetch the local timestamp in seconds', async (ctx) => {
	const t = Math.floor(new Date().getTime() / 1000);
	return ctx.pass(t.toString());
});

export const timestamp = p;
