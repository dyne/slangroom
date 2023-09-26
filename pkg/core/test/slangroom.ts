import test from 'ava';
import { line2AST, SlangroomContext, readTimestamp, evaluate, saveToConsole } from '@slangroom/core';
line2AST;

test("Generate correct AST 1", async (t) => {
	t;
	const res = line2AST("read the ethereum balance of 'address' and save in the file 'baz'")
	t.deepEqual(res.value, {
		"kind":"And",
		"read":{"clause":"the ethereum balance of ''","args":["address"]},
		"save":{"clause":"in the file ''","args":["baz"]}
	})
})
test("Generate correct AST 2", async (t) => {
	t;
	const res = line2AST("read the ethereum balance of 'address' into 'bar'")
	t.deepEqual(res.value, {
		"kind":"Into",
		"read":{"clause":"the ethereum balance of ''","args":["address"]},
		"result":"bar"
	})
})

test("Run simple Into", async (t) => {
	const srCtx: SlangroomContext = new SlangroomContext()
	srCtx.addRead("the current timestamp", readTimestamp)

	const ast = line2AST("read the current timestamp into 'bar'")
	t.deepEqual(ast.value, {
		"kind":"Into",
		"read":{"clause":"the current timestamp","args":[]},
		"result":"bar"
	})

	const res = evaluate(srCtx, ast.value, {}, {data: {}, context: {}})
	t.truthy(Object.keys(res.data).includes("bar"))
})

test("Run simple And", async (t) => {
	const srCtx: SlangroomContext = new SlangroomContext()
	srCtx.addRead("the current timestamp", readTimestamp)
	srCtx.addSave("it to console", saveToConsole)

	const ast = line2AST("read the current timestamp and save it to console")
	t.deepEqual(ast.value, {
		"kind":"And",
		"read":{"clause":"the current timestamp","args":[]},
		"save":{"clause":"it to console","args":[]},
	})

	const res = evaluate(srCtx, ast.value, {}, {data: {}, context: {}})
	t.truthy(Object.keys(res.context).includes("raw"))
})
