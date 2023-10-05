import test from 'ava';
import express from "express";
import bodyParser from "body-parser";
import { EvaluationResultKind } from "@slangroom/core/plugin"
import { Jsonable } from "@slangroom/shared/jsonable"

import {
	astify,
	evaluate,
	RequestKind,
	RequestMethod,
} from '@slangroom/http';

test.before(async () => {
	const app = express();
	app.use(bodyParser.json());
	app.get("/normaljson", (_req: any, res: any) => {
		const responsejson = {
			userId: 1,
			myArray: [1, 2, 3, 4, 5],
			myStringArary: ["one", "two", "three"],
			myJson: {
				1: "First property",
				2: 123,
				// "3": true
			},
		};
		res.status(200).send(responsejson);
	});
	app.get("/booleanjson", (_req: any, res: any) => {
		const responsejson = {
			userId: 1,
			myJson: {
				1: "First property",
				2: 123,
				3: true,
			},
		};
		res.status(200).send(responsejson);
	});
	app.post("/sendresult", (req: any, res: any) => {
		try {
			if (Object.keys(req.body).includes("myData")) {
				res.status(200).send("received result");
			} else {
				res.status(500).send("Did not receive the result");
			}
		} catch {
			res
				.status(505)
				.send("Something is wrong with the result sent by zenroom");
		}
	});
	app.get("/storeoutput", (_req: any, res: any) => {
		const output = {
			mySharedSecret: [{
				x: "b6J49SRdmJ3xKSbm4/m1MnE4q4k9PV3QfGmJaXxzSqc=",
				y: "CX25HWpn7wNVbii04JJzUuLGg3iV98RdfexlimnYy4s=",
			},
			{
				x: "r2c5Oqnv3nFDLxeji+t+VHyCbZIqwkPHIINS5e/XZms=",
				y: "toxNY+pjSpHAwYb+XaecxrWn0JsI+QcHeJHcl1bxYSk=",
			},
			{
				x: "S5XL4Eccy5g9wfyYdzz814cQ+50sAK/n+UuqekJUdPQ=",
				y: "MdH2wEsqwq2XtjSoK4oZdmM4FsbcR/3ByOsv0CWc90E=",
			},
			{
				x: "cE7y3I+33bf0Do+hpcoQeQKALKTsalAWOCke1+pYuAE=",
				y: "UAmR+N61zlJKwW6KyoTXwf+4Z3raeWt4Gbax0lQFqME=",
			},
			],
		};
		res.status(200).send(output);
	});
	app.listen(3020, () => console.log("Server up and running on "));
});

test("Simple GET", async (t) => {
	const ast = astify("do get");
	t.deepEqual(ast.value, { method: RequestMethod.Get, kind: RequestKind.Default })
	const res = await evaluate(ast.value, new Map([["connect", "http://localhost:3020/normaljson"]]))
	t.deepEqual(res, {
		kind: EvaluationResultKind.Success,
		result:{
			status: 200,
			result:{
				userId: 1,
				myArray: [1,2,3,4,5],
				myStringArary: ["one","two","three"],
				myJson: {
					1:"First property",
					2:123
				}
			}
		}
	})
})
test("POST with data", async (t) => {
	const ast = astify("do post");
	t.deepEqual(ast.value, { method: RequestMethod.Post, kind: RequestKind.Default })

	const res = await evaluate(ast.value, new Map<string, Jsonable>([["connect", "http://localhost:3020/sendresult"], ["object", {myData: "foobar"}]]))

	t.deepEqual(res, {
		kind: EvaluationResultKind.Success,
		result: {status: 200, result: "received result"},
	})
})
test("POSTs with data", async (t) => {
	const ast = astify("do same post");
	t.deepEqual(ast.value, { method: RequestMethod.Post, kind: RequestKind.Same})

	const res = await evaluate(ast.value, new Map<string, Jsonable>([["connect", ["http://localhost:3020/sendresult", "http://localhost:3020/normaljson"]], ["object", {myData: "foobar"}]]))
	t.deepEqual(res, {
		kind: EvaluationResultKind.Success,
		result: [
			{ status: 200, result: 'received result' },
			{
			  status: 404,
			  result: '<!DOCTYPE html>\n' +
				'<html lang="en">\n' +
				'<head>\n' +
				'<meta charset="utf-8">\n' +
				'<title>Error</title>\n' +
				'</head>\n' +
				'<body>\n' +
				'<pre>Cannot POST /normaljson</pre>\n' +
				'</body>\n' +
				'</html>\n'
			}
		]

	})
})
test("POSTs with custom different", async (t) => {
	const ast = astify("do parallel post");

	t.deepEqual(ast.value, { method: RequestMethod.Post, kind: RequestKind.Parallel })

	const res = await evaluate(ast.value,
		new Map<string, Jsonable>([
			["object", [{myData: "foobar"},{myData: "foobar"},{mData: "foobar"}]],
			["connect", [
				"http://localhost:3020/sendresult",
				"http://localhost:3020/normaljson",
				"http://localhost:3020/sendresult"
			]]]))

	t.deepEqual(res, {
		kind: EvaluationResultKind.Success,
		result: [
			{ status: 200, result: 'received result' },
			{
			  status: 404,
			  result: '<!DOCTYPE html>\n' +
				'<html lang="en">\n' +
				'<head>\n' +
				'<meta charset="utf-8">\n' +
				'<title>Error</title>\n' +
				'</head>\n' +
				'<body>\n' +
				'<pre>Cannot POST /normaljson</pre>\n' +
				'</body>\n' +
				'</html>\n'
			},
			{ result: 'Did not receive the result', status: 500 },
		  ]
	})
})
