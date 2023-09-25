import test from 'ava';
import { line2AST } from '@slangroom/core';
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
