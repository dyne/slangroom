import test from 'ava';
import { Plugin } from '../src/plugin.js';
import { Slangroom } from '../src/slangroom.js';

test("Runs all unknown statements", async (t) => {
	let useR1 = false;
	let useR2 = false;
	let useR3 = false;
	const r1 = new Plugin("a", [], (...[]) => {
		useR1 = true;
		return "foo"
	})
	const r2 = new Plugin("b", ["a"], (...[a]) => {
		useR2 = true
		t.is(a, "foo")
		return "bar"
	})
	const r3 = new Plugin("c d", ["a"], (...[a]) => {
		useR3 = true
		t.is(a, "bar")
		return "foobar"
	})
	const script = `
Rule caller restroom-mw
Given I A and output into 'a'

Given I have a 'string' named 'a'
Then print 'a'

Then I pass a 'a' and B and output into 'b'
Then I pass a 'b' and  c D
Then I pass a 'b' and  C d and output into 'mimmo'
`
	const slangroom = new Slangroom(r1, [r2, r3]);
	const res = await slangroom.execute(script, {})
	t.truthy(useR1, "r1 is not used")
	t.truthy(useR2, "r2 is not used")
	t.truthy(useR3, "r3 is not used")
	t.deepEqual(res.result, { a: 'foo', b: 'bar', mimmo: 'foobar' }, res.logs)
})
