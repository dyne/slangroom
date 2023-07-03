/*
import { writeFileSync } from 'fs';
import { resolve } from 'path';
*/
import { generateCstDts, type CstParser } from '@slangroom/deps/chevrotain';

/**
 * Generates typescript types, suitable for a .d.ts file, out of a
 * parser definition.
 *
 * @param parser is a CstParser.
 * @returns the contents of a .d.ts file, generated from the given
 * parser.
 */
export const genTypes = (parser: CstParser): string => generateCstDts(parser.getGAstProductions());

/*
const dtsPath = resolve(__dirname, '..', 'json_cst.d.ts');
writeFileSync(dtsPath, dtsString);
*/
