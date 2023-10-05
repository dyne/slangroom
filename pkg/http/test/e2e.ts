import test from 'ava';
import express from "express";
import bodyParser from "body-parser";
import { Slangroom } from "@slangroom/core/slangroom"
import httpPlugin from "@slangroom/http"

test.before(async () => {
	const app = express();
	app.use(bodyParser.json());
	app.get("/greeting-es", (_req: any, res: any) => {
		res.status(200).send({req: "Hola chico!"});
	});
	app.get("/greeting-en", (_req: any, res: any) => {
		res.status(200).send({req: "Hi!"});
	});
	app.post("/sendresult", (req: any, res: any) => {
		try {
			if (req.body.req.includes("Hola")) {
				res.status(200).send("received result");
			} else if (req.body.req.includes("Hi")) {
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
	app.listen(3021, () => console.log("Server up and running on "));
});

test("Full script that uses http plugin", async (t) => {
	const script = `
Rule caller restroom-mw
Given I connect to 'greeting_es' and do get and output into 'es'
Given I connect to 'greeting_en' and do get and output into 'en'

Given I have a 'string dictionary' named 'result' in 'es'
Given I rename 'result' to 'result es'
Given I have a 'string dictionary' named 'result' in 'en'
Given I rename 'result' to 'result en'


Given I have a 'string array' named 'final endpoints'
When I create the 'string array'
When I move 'result_es' in 'string array'
When I move 'result_en' in 'string array'
Then print data
Then I connect to 'final_endpoints' and send object 'string_array' and do parallel post and output into 'results'
`
	const slangroom = new Slangroom(httpPlugin);
	const res = await slangroom.execute(script, {data: {
		greeting_es: "http://localhost:3021/greeting-es",
		greeting_en: "http://localhost:3021/greeting-en",
		final_endpoints: [
			"http://localhost:3021/sendresult",
			"http://localhost:3021/sendresult",
		]
	}})
	t.deepEqual(res.result, {
		final_endpoints: [
			'http://localhost:3021/sendresult',
			'http://localhost:3021/sendresult'
		],
		string_array: [ { req: 'Hola chico!' }, { req: 'Hi!' } ],
		results: [
			{ status: 200, result: 'received result' },
			{ status: 200, result: 'received result' }
		]
	}, res.logs)
})
