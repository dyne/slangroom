// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { rdf } from '@slangroom/rdf';
// read the version from the package.json
// import packageJson from '@slangroom/rdf/package.json' with { type: 'json' };

// const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

test('canonicalization', async (t) => {
    const slangroom = new Slangroom(rdf);
	const script: string = `Rule unknown ignore
Given I send dataset 'dataset' and do canonicalization and output into 'res'
Given I have a 'string' named 'res'
Then print the 'res'
`;
	const expected_res: string = `<did:example:ebfeb1f712ebc6f1c276e12ec21> <https://www.w3.org/ns/credentials/examples#degree> _:c14n0 .
<http://university.example/credentials/3732> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/2018/credentials#VerifiableCredential> .
<http://university.example/credentials/3732> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/credentials/examples#ExampleDegreeCredential> .
<http://university.example/credentials/3732> <https://www.w3.org/2018/credentials#credentialSubject> <did:example:ebfeb1f712ebc6f1c276e12ec21> .
<http://university.example/credentials/3732> <https://www.w3.org/2018/credentials#issuer> <https://university.example/issuers/565049> .
<http://university.example/credentials/3732> <https://www.w3.org/2018/credentials#validFrom> "2010-01-01T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
_:c14n0 <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://www.w3.org/ns/credentials/examples#ExampleBachelorDegree> .
_:c14n0 <https://schema.org/name> "Bachelor of Science and Arts" .
`
    const fn = slangroom.execute(script, {
        data: {
            dataset: {
				"@context": [
					"https://www.w3.org/ns/credentials/v2",
					"https://www.w3.org/ns/credentials/examples/v2"
				],
				id: "http://university.example/credentials/3732",
				type: ["VerifiableCredential", "ExampleDegreeCredential"],
				issuer: "https://university.example/issuers/565049",
				validFrom: "2010-01-01T00:00:00Z",
				credentialSubject: {
					id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
					degree: {
						type: "ExampleBachelorDegree",
						name: "Bachelor of Science and Arts"
					}
				}
			}
        }
    });
	const result = await fn;
    t.is(result.result['res'], expected_res, JSON.stringify(result.result));
});
