import test from 'ava';
import express from "express";
import bodyParser from "body-parser";

import { line2Ast, Method, DefaultBodyKind, evaluate } from '@slangroom/http/read';

test.before(async (_t) => {
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
	const ast = line2Ast("get endpoint 'endpoint'");
	t.deepEqual(ast.value, { method: Method.GET, receiver: { kind: 'Endpoint', name: 'endpoint' } })
	const res = await evaluate(ast.value, {}, {data: {endpoint: "http://localhost:3020/normaljson"}, context: {}})
	t.deepEqual(res, {
		status: 200,
		result: {
		  userId: 1,
		  myArray: [ 1, 2, 3, 4, 5 ],
		  myStringArary: [ 'one', 'two', 'three' ],
		  myJson: { '1': 'First property', '2': 123 }
		}
	  })
})
test("POST with data", async (t) => {
	const ast = line2Ast("post endpoint 'endpoint' passing data");
	t.deepEqual(ast.value, { method: Method.POST, receiver: { kind: 'Endpoint', name: 'endpoint' }, body: {kind: "Default",  body: DefaultBodyKind.DATA} })

	const res = await evaluate(ast.value, {}, {data: {endpoint: "http://localhost:3020/sendresult", myData: "foobar"}, context: {}})

	t.deepEqual(res, {status: 200, result: "received result"})


})
test("POST with custom", async (t) => {
	// TODO(urgent!!): single quote marks can include the word data
	const ast = line2Ast("post endpoint 'endpoint' passing 'custom'");
	t.deepEqual(ast.value, { method: Method.POST, receiver: { kind: 'Endpoint', name: 'endpoint' }, body: { kind: "Custom", identifier: "custom" } })

	const res = await evaluate(ast.value, {}, { data: { endpoint: "http://localhost:3020/sendresult", custom: { myData: "foobar" } }, context: {} })

	t.deepEqual(res, {status: 200, result: "received result"})
})
test("POSTs with data", async (t) => {
	const ast = line2Ast("post endpoints 'foo' passing all");
	t.deepEqual(ast.value, { method: Method.POST, receiver: { kind: 'Endpoints', name: 'foo', differentData: false }, body: {kind: "Default",  body: DefaultBodyKind.ALL} })

	const res = await evaluate(ast.value, {myData: "foobar"}, { data: { foo: ["http://localhost:3020/sendresult", "http://localhost:3020/normaljson"] }, context: {} })
	t.deepEqual(res, [
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
	  ])
})
test("POSTs with custom different", async (t) => {
	const ast = line2Ast("post endpoints 'foo' passing different 'bar'");

	t.deepEqual(ast.value, { method: Method.POST, receiver: { kind: 'Endpoints', name: 'foo', differentData: true }, body: {kind: "Custom",  identifier: "bar"} })

	const res = await evaluate(ast.value, {bar: [{myData: "foobar"},{myData: "foobar"},{mData: "foobar"}]}, { data: { foo: ["http://localhost:3020/sendresult", "http://localhost:3020/normaljson", "http://localhost:3020/sendresult"] }, context: {} })

	t.deepEqual(res, [
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
	  ])
})

