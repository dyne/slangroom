import { Slangroom } from '@slangroom/core';
import { httpPlugins } from '@slangroom/http';
const slangroom = new Slangroom(httpPlugins);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).slangroom = slangroom; // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

console.log('slangroom object initialized');
