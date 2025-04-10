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
Given I send dataset 'dataset' and canonicalize it and output into 'res'
Given I have a 'string' named 'res'
Then print the 'res'
`;
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
    t.is(result.result['res'], "substitute correct result", JSON.stringify(result.result));
});
