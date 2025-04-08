// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Plugin, Slangroom } from '@slangroom/core';
import test from 'ava';
// read the version from the package.json
import packageJson from '@slangroom/core/package.json' with { type: 'json' };
import ignoredPackageJson from '@slangroom/ignored/package.json' with { type: 'json' };

import {
	sentenceHighlight,
	textHighlight,
	errorColor,
	suggestedColor,
	missingColor,
	extraColor,
	lineNoColor
} from '@slangroom/shared';

const errorColorDef = `
Error colors:
 - ${errorColor('error')}
 - ${suggestedColor('suggested words')}
 - ${missingColor('missing words')}
 - ${extraColor('extra words')}
`

test('@slangroom/core errors are shown and context is shown with line number', async (t) => {
    const plugin = new Plugin();
    plugin.new(['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I gibberish
    Given nothing
    Then print data`)

    const expected = `${lineNoColor('0 | ')}Rule unknown ignore
${lineNoColor('1 | ')}${sentenceHighlight(`    Given I ${textHighlight('gibberish')}`)}
                ${errorColor('^^^^^^^^^')}
${lineNoColor('2 | ')}    Given nothing
${lineNoColor('3 | ')}    Then print data
${errorColorDef}
ParseError @slangroom/core@${packageJson.version}: at 2:9-17
 ${errorColor('gibberish')} may be ${suggestedColor('send')}

ParseError @slangroom/core@${packageJson.version}: at 2:9-17
 must be followed by one of: ${missingColor('param')}

ParseError @slangroom/core@${packageJson.version}: at 2
 missing one of: ${missingColor('\'<identifier>\'')}

ParseError @slangroom/core@${packageJson.version}: at 2
 missing one of: ${missingColor('and')}

ParseError @slangroom/core@${packageJson.version}: at 2
 missing one of: ${missingColor('do')}

ParseError @slangroom/core@${packageJson.version}: at 2
 missing one of: ${missingColor('some')}

ParseError @slangroom/core@${packageJson.version}: at 2
 missing one of: ${missingColor('action')}
`

    const err = await t.throwsAsync(fn);
    t.is(err?.message, expected);
});

test('@slangroom/core lexer error', async (t) => {
    const plugin = new Plugin();
    plugin.new(['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I send param 'param and do some action
    Given nothing
    Then print data`)

    const expected = `${lineNoColor('0 | ')}Rule unknown ignore
${lineNoColor('1 | ')}${sentenceHighlight(`    Given I send param ${textHighlight('\'param and do some action')}`)}
                           ${errorColor('^^^^^^^^^^^^^^^^^^^^^^^^^')}
${lineNoColor('2 | ')}    Given nothing
${lineNoColor('3 | ')}    Then print data
${errorColorDef}
LexError @slangroom/core@${packageJson.version}: at 2:20-44
 unclosed single-quote ${errorColor('\'param and do some action')}
`

    const err = await t.throwsAsync(fn);
	t.is(err?.message, expected);
});


test('@slangroom/core parser error does not start with given', async (t) => {
    const plugin = new Plugin();
    plugin.new('connect', ['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Gibberish connect to 'url' and send param 'param' and do some action and aoibndwebnd
    Given nothing
    Then print data`)

    const expected = `${lineNoColor('0 | ')}Rule unknown ignore
${lineNoColor('1 | ')}${sentenceHighlight(`    ${textHighlight('Gibberish')} connect to 'url' and send param 'param' and do some action and aoibndwebnd`)}
        ${errorColor('^^^^^^^^^')}
${lineNoColor('2 | ')}    Given nothing
${lineNoColor('3 | ')}    Then print data
${errorColorDef}
ParseError @slangroom/core@${packageJson.version}: at 2:1-9
 ${errorColor('Gibberish')} may be ${suggestedColor('given')} or ${suggestedColor('then')}

ParseError @slangroom/core@${packageJson.version}: at 2:1-9
 must be followed by one of: ${missingColor('I')}

ParseError @slangroom/core@${packageJson.version}: at 2:70-72
 extra token ${extraColor('and')}

ParseError @slangroom/core@${packageJson.version}: at 2:74-84
 extra token ${extraColor('aoibndwebnd')}
`

	const err = await t.throwsAsync(fn);
	t.is(err?.message, expected);
});

test('Slangroom error are shown with context', async (t) => {
	const plugin = new Plugin();
    plugin.new('connect', ['param'], 'do some action', (_) => _.fail(new Error("Something went horribly wrong")));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I connect to 'url' and send param 'param' and do some action and output into 'res'
    Given I have a 'string' named 'res'
    Then print data`,
	{
		data: {
			url: 'https://example.com',
			param: {
				foo: 'bar'
			}
		},
		keys: {
			something: 'else'
		}
	});

	const expected = `${lineNoColor('0 | ')}Rule unknown ignore
${lineNoColor('1 | ')}${sentenceHighlight(`    ${textHighlight(`Given I connect to 'url' and send param 'param' and do some action and output into 'res'`)}`)}
        ${errorColor('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')}
${lineNoColor('2 | ')}    Given I have a 'string' named 'res'
${lineNoColor('3 | ')}    Then print data

Error colors:
 - ${errorColor('error')}
 - ${suggestedColor('suggested words')}
 - ${missingColor('missing words')}
 - ${extraColor('extra words')}

Error: Something went horribly wrong

Heap:
{
    "url": "https://example.com",
    "param": {
        "foo": "bar"
    }
}
`;

	const err = await t.throwsAsync(fn);
	t.is(err?.message, expected, err?.message);
});

test('@slangroom/core invalid line error', async (t) => {
    const plugin = new Plugin();
    plugin.new('connect', ['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I connect to 'url' and send param 'param' and do some action
    Given nothing
	Gibberish
    Then print data`)

    const expected = `${lineNoColor('2 | ')}    Given nothing
${lineNoColor('3 | ')}${sentenceHighlight(`    ${textHighlight('Gibberish')}`)}
        ${errorColor('^^^^^^^^^')}
${lineNoColor('4 | ')}    Then print data
${errorColorDef}
Zencode Invalid Statement @slangroom/ignored@${ignoredPackageJson.version} Error: Invalid Zencode line
`

	const err = await t.throwsAsync(fn);
	t.is(err?.message, expected);
});

test('@slangroom/core error in the then phase', async (t) => {
    const plugin = new Plugin();
    plugin.new('do some action', (_) => _.fail(new Error('failed')));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given nothing
	Then print data
	Then I do some action`)

    const expected = `${lineNoColor('2 | ')}    Then print data
${lineNoColor('3 | ')}${sentenceHighlight(`    ${textHighlight('Then I do some action')}`)}
        ${errorColor('^^^^^^^^^^^^^^^^^^^^^')}
${errorColorDef}
Error: failed

Heap:
[]
`

	const err = await t.throwsAsync(fn);
	t.is(err?.message, expected);
});
