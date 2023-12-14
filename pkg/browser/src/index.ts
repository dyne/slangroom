import { Slangroom } from '@slangroom/core';
import { qrcode } from '@slangroom/qrcode';
import { http } from '@slangroom/http';
import {JSONSchema} from '@slangroom/json-schema'
const slangroom = new Slangroom([http, qrcode, JSONSchema]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).slangroom = slangroom; // instead of casting window to any, you can extend the Window interface: https://stackoverflow.com/a/43513740/5433572

console.log('🎉 Slangroom is ready');
