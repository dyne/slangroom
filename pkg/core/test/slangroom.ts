import test from 'ava';
import { ReadPlugin } from '../src/plugin.js';
import { Slangroom } from '../src/slangroom.js';

test("Runs all unknown statements", async (t) => {
	let useR1 = false;
	let useR2 = false;
	let useR3 = false;
	const r1 = new ReadPlugin("a", [], (...[]) => {
		useR1 = true;
		return "foo"
	})
	const r2 = new ReadPlugin("b", ["a"], (...[output]) => {
		useR2 = true
		t.is(output, "foo")
		return "bar"
	})
	const r3 = new ReadPlugin("c d", ["a"], (...[output]) => {
		useR3 = true
		t.is(output, "bar")
		return "foobar"
	})
	const script = `
Rule caller restroom-mw
Given I read A

Given I have a 'string' named 'a'
Then print 'a'

Then I pass 'a' and read B
Then I pass a 'b' and read c D
Then I pass a 'b' and read C d into 'mimmo'
`
	const slangroom = new Slangroom(r1, r2, r3);
	const res = await slangroom.execute(script, {})
	t.truthy(useR1, "r1 is not used")
	t.truthy(useR2, "r2 is not used")
	t.truthy(useR3, "r3 is not used")
	t.deepEqual(res.result, { a: 'foo', b: 'bar', c_d: 'foobar', mimmo: 'foobar' }, res.logs)
})
