
import { Plugin, Slangroom } from '@slangroom/core';
import test from 'ava';
// read the version from the package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('@slangroom/core/package.json');
// error colors
import { errorColor, suggestedColor, missingColor, extraColor } from '@slangroom/core';


test('@slangroom/core errors are shown and context is shown with line number', async (t) => {
    const plugin = new Plugin();
    plugin.new(['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I gibberish
    Given nothing
    Then print data`)

    const expected = `\x1b[33m0 | \x1b[0mRule unknown ignore
\x1b[33m1 | \x1b[0m\x1b[41m    Given I \x1b[1;30mgibberish\x1b[0m\x1b[41m\x1b[0m
                \x1b[31m^^^^^^^^^\x1b[0m
\x1b[33m2 | \x1b[0m    Given nothing
\x1b[33m3 | \x1b[0m    Then print data

Error colors:
 - ${errorColor('error')}
 - ${suggestedColor('suggested words')}
 - ${missingColor('missing words')}
 - ${extraColor('extra words')}

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

    const expected = `\x1b[33m0 | \x1b[0mRule unknown ignore
\x1b[33m1 | \x1b[0m\x1b[41m    Given I send param \x1b[1;30m'param and do some action\x1b[0m\x1b[41m\x1b[0m
                           \x1b[31m^^^^^^^^^^^^^^^^^^^^^^^^^\x1b[0m
\x1b[33m2 | \x1b[0m    Given nothing
\x1b[33m3 | \x1b[0m    Then print data

Error colors:
 - ${errorColor('error')}
 - ${suggestedColor('suggested words')}
 - ${missingColor('missing words')}
 - ${extraColor('extra words')}

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

    const expected = `\x1b[33m0 | \x1b[0mRule unknown ignore
\x1b[33m1 | \x1b[0m\x1b[41m    \x1b[1;30mGibberish\x1b[0m\x1b[41m connect to 'url' and send param 'param' and do some action and aoibndwebnd\x1b[0m
        \x1b[31m^^^^^^^^^\x1b[0m
\x1b[33m2 | \x1b[0m    Given nothing
\x1b[33m3 | \x1b[0m    Then print data

Error colors:
 - ${errorColor('error')}
 - ${suggestedColor('suggested words')}
 - ${missingColor('missing words')}
 - ${extraColor('extra words')}

ParseError @slangroom/core@${packageJson.version}: at 2:1-9
 ${errorColor('Gibberish')} may be ${suggestedColor('given')} or ${suggestedColor('then')}

ParseError @slangroom/core@${packageJson.version}: at 2:11-17
 ${errorColor('connect')} may be ${suggestedColor('I')}

ParseError @slangroom/core@${packageJson.version}: at 2:19-20
 ${errorColor('to')} may be ${suggestedColor('connect')}

ParseError @slangroom/core@${packageJson.version}: at 2:22-26
 ${errorColor('\'url\'')} may be ${suggestedColor('to')}

ParseError @slangroom/core@${packageJson.version}: at 2:28-30
 ${errorColor('and')} may be ${suggestedColor('\'<identifier>\'')}

ParseError @slangroom/core@${packageJson.version}: at 2:32-35
 ${errorColor('send')} may be ${suggestedColor('and')}

ParseError @slangroom/core@${packageJson.version}: at 2:37-41
 ${errorColor('param')} may be ${suggestedColor('send')}

ParseError @slangroom/core@${packageJson.version}: at 2:43-49
 ${errorColor('\'param\'')} may be ${suggestedColor('param')}

ParseError @slangroom/core@${packageJson.version}: at 2:51-53
 ${errorColor('and')} may be ${suggestedColor('\'<identifier>\'')}

ParseError @slangroom/core@${packageJson.version}: at 2:55-56
 ${errorColor('do')} may be ${suggestedColor('and')}

ParseError @slangroom/core@${packageJson.version}: at 2:58-61
 ${errorColor('some')} may be ${suggestedColor('do')}

ParseError @slangroom/core@${packageJson.version}: at 2:63-68
 ${errorColor('action')} may be ${suggestedColor('some')}

ParseError @slangroom/core@${packageJson.version}: at 2:70-72
 ${errorColor('and')} may be ${suggestedColor('action')}

ParseError @slangroom/core@${packageJson.version}: at 2:74-84
 extra token ${extraColor('aoibndwebnd')}
`

	const err = await t.throwsAsync(fn);
	t.is(err?.message, expected);
});
