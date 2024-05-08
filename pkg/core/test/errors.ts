
import { Plugin, Slangroom } from '@slangroom/core';
import test from 'ava';

test('@slangroom/core errors are shown and context is shown with line number', async (t) => {
    const plugin = new Plugin();
    plugin.new(['param'], 'do some action', (_) => _.pass(null));

    const slang = new Slangroom(plugin);
    const fn = slang.execute(`Rule unknown ignore
    Given I gibberish
    Given nothing
    Then print data`)

    const expected = `\x1b[33m0 | \x1b[0mRule unknown ignore
\x1b[33m1 | \x1b[0m    Given I gibberish
                \x1b[31m^^^^^^^^^\x1b[0m
\x1b[33m2 | \x1b[0m    Given nothing
\x1b[33m3 | \x1b[0m    Then print data
ParseError: "gibberish" at 2:9-17 must be one of: "send"
ParseError: at 2:9-17, must be followed by one of: "param"
ParseError: at 2, missing one of: "<identifier>"
ParseError: at 2, missing one of: "and"
ParseError: at 2, missing one of: "do"
ParseError: at 2, missing one of: "some"
ParseError: at 2, missing one of: "action"
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
\x1b[33m1 | \x1b[0m    Given I send param 'param and do some action
                           \x1b[31m^^^^^^^^^^^^^^^^^^^^^^^^^\x1b[0m
\x1b[33m2 | \x1b[0m    Given nothing
\x1b[33m3 | \x1b[0m    Then print data
LexError: unclosed single-quote at 2:20-44: 'param and do some action
`

    const err = await t.throwsAsync(fn);
    t.is(err?.message, expected);
});
