import test from 'ava';
import { Plugin } from '../src/plugin.js';
import { Slangroom } from '../src/slangroom.js';
import { EvaluationResult, EvaluationResultKind } from '../src/plugin.js'

test("Runs all unknown statements", async (t) => {
	let useR1 = false;
	let useR2 = false;
	let useR3 = false;

	class PluginA extends Plugin {
		async evaluate(phrase: string): Promise<EvaluationResult> {
			if(phrase == "a") {
				useR1 = true;
				return {
					kind: EvaluationResultKind.Success,
					result: "foo"
				}
			}
			return {
				kind: EvaluationResultKind.Failure,
				error: "Unknown phrase"
			}
		}
	}
	class PluginB extends Plugin {
		async evaluate(phrase: string): Promise<EvaluationResult> {
			const args = this.buildParams(new Map<string,boolean>([["a", true]]))
			if(phrase == "b") {
				useR2 = true
				t.is(args.get("a"), "foo")
				return {
					kind: EvaluationResultKind.Success,
					result: "bar"
				}
			}
			return {
				kind: EvaluationResultKind.Failure,
				error: "Unknown phrase"
			}
		}
	}
	class PluginCD extends Plugin {
		async evaluate(phrase: string): Promise<EvaluationResult> {
			const args = this.buildParams(new Map<string,boolean>([["a", true]]))
			if(phrase == "c d") {
				useR3 = true
				t.is(args.get("a"), "bar")
				return {
					kind: EvaluationResultKind.Success,
					result: "foobar"
				}
			}
			return {
				kind: EvaluationResultKind.Failure,
				error: "Unknown phrase"
			}
		}
	}

	const r1 = new PluginA()
	const r2 = new PluginB()
	const r3 = new PluginCD()

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
