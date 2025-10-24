// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { dcql } from '@slangroom/dcql';
// read the version from the package.json
import packageJson from '@slangroom/dcql/package.json' with { type: 'json' };

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const ldpVcVpTokenJson = {
	my_ldpvc_credential: [
		{
			"@context": [
				"https://www.w3.org/ns/credentials/v2",
				"https://w3id.org/security/data-integrity/v2"
			],
			holder: "did:dyne:sandbox.signroom:4KEymWgLDUf1LNckexY96dfKz5vH79diDekgLMR9FWpH",
			id: "8242c66a3019",
			proof: {
				challenge: "e86ec4813729125bb4ff409e02d70c317a32484d7c7551a62f814ab883b5ed98",
				created: "2025-10-24T11:39:35Z",
				cryptosuite: "ecdsa-rdfc-2019",
				domain: "decentralized_identifier:did:dyne:sandbox.genericissuer:4Xx5rAWAG2iDEgVQRcEJPSunaimu6nW3dh3RVJ8qruZ6#es256_public_key",
				proofPurpose: "authentication",
				proofValue: "zA4UAWotFmTtiF6fvdzV1kFeu5rKB1C1efjCty1K7HZ8W9yW28Fb1A57C7nd35Xt8DkfFPSa3TJSkttrcp99NuLV",
				type: "DataIntegrityProof",
				verificationMethod: "did:dyne:sandbox.signroom:4KEymWgLDUf1LNckexY96dfKz5vH79diDekgLMR9FWpH#es256_public_key"
			},
			type: [
				"VerifiablePresentation"
			],
			verifiableCredential: [
				{
					"@context": [
						"https://www.w3.org/ns/credentials/v2",
						"https://www.w3.org/ns/credentials/examples/v2"
					],
					credentialSubject: {
						formid: "aducB7jazEVpH3hHdLBzzM",
						instanceid: "uuid:c2492b4d-bdbb-3554-88c0-383dca60482a",
						submissiondate: "2025-10-16T14:04:41.643318+00:00"
					},
					issuer: "https://issuer1.zenswarm.forkbomb.eu/credential_issuer",
					proof: {
						created: "2025-10-16T14:04:44Z",
						cryptosuite: "ecdsa-rdfc-2019",
						proofPurpose: "assertionMethod",
						proofValue: "z4EYmvtjQjxeaRbMQVVKHE6zwQnPMrfeYciDTXkf2CN8kRbqNP5sQxcrbgHGvRRozpi4qikidtVtWmHG5PAB7cT1K",
						type: "DataIntegrityProof",
						verificationMethod: "did:dyne:sandbox.genericissuer:BZLR2Rq1d9Uquw49wJukgZCecAoQt1NU7xDZoAUjh5gj#es256_public_key"
					},
					type: [
						"VerifiableCredential",
						"questionnaire"
					],
					validUntil: "2026-04-18T14:04:44Z"
				}
			]
		}
	]
}
/*
const ldpVcVpToken = {
	vp_token: JSON.stringify(ldpVcVpTokenJson)
}
*/
const dcSdJwtVpTokenJson = {
	my_dcsdjwt_credential: [
		"eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCJ9.eyJfc2QiOiBbIk5UWGptakduN09rRTBqZ3N1aVc0YWgzcllQVVVEYlJvcHg0T1BUbkRrLUUiXSwgIl9zZF9hbGciOiAic2hhLTI1NiIsICJjbmYiOiB7Imp3ayI6IHsiY3J2IjogIlAtMjU2IiwgImt0eSI6ICJFQyIsICJ4IjogInpKLTR1d0VWVlYxQW9GcW1yZVlzUlh1SjhGbzVHRVVUeTZ0aklBdjdUcFkiLCAieSI6ICJWb1h2YTNUSkdzSjluOVlXNXcwamUwenpTaGZic3dBZ3pIcjVMRkJIM2xnIn19LCAiZXhwIjogMTc5MjgzMTU2MywgImlhdCI6IDE3NjEyOTU1NjMsICJpc3MiOiAiaHR0cHM6Ly9pc3N1ZXIxLnplbnN3YXJtLmZvcmtib21iLmV1L2NyZWRlbnRpYWxfaXNzdWVyIiwgIm5iZiI6IDE3NjEyOTU1NjMsICJzdWIiOiAiZGlkOmR5bmU6c2FuZGJveC5zaWducm9vbTo0S0V5bVdnTERVZjFMTmNrZXhZOTZkZkt6NXZINzlkaURla2dMTVI5RldwSCIsICJ0eXBlIjogImRpc2NvdW50X2Zyb21fdm91Y2hlciJ9.4-SvoLq0DnQ399X8LkR7U_TBv7okJQmc0y7ShWBgYWryVs50YbkKH5cM4sar_QmPFTNqdOXgERzJMjqzcQVBUQ~WyJUX2doS3EyVlpwUFNGU19meVV3UTJRIiwgImhhc19kaXNjb3VudF9mcm9tX3ZvdWNoZXIiLCAyMF0~eyJhbGciOiJFUzI1NiIsInR5cCI6ImtiK2p3dCJ9.eyJhdWQiOiJkZWNlbnRyYWxpemVkX2lkZW50aWZpZXI6ZGlkOmR5bmU6c2FuZGJveC5nZW5lcmljaXNzdWVyOjRYeDVyQVdBRzJpREVnVlFSY0VKUFN1bmFpbXU2blczZGgzUlZKOHFydVo2I2VzMjU2X3B1YmxpY19rZXkiLCJpYXQiOjE3NjEzMTA5NDAsIm5vbmNlIjoiYjk1NGQ3ZjM3YmFmYWRlNTcyNmMwMDc4ZmUzNzU4MmE2NzUwZjY5YWRjMmJjMDZiYzE5MmI0ZTgyNjYwZWU1OSIsInNkX2hhc2giOiJXbFVBSDhuY3ZNU0VZNE9tbWN3SjRhUV9zdEZoVWNua3AxeVEtR0taMno0In0.z8e_ls0hIocjkNP9zlM6higpks3FfhIubkTaCmx26Lcic9gHAHtiOrZ_zmol3nGyf3Dy51mlBvvhojHrftm2ww"
	]
}
const dcSdJwtVpToken = {
	vp_token: JSON.stringify(dcSdJwtVpTokenJson)
}

const VALIDATE = `
Prepare: validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'

Given I have a 'string' named 'vp_token'
When I set 'result' to 'OK' as 'string'
Then print the 'result'
`

test('dc+sd-jwt', async (t) => {
	const dcSdJwtDcqlQuery = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"discount_from_voucher"
						]
					},
					claims: [
						{
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: dcSdJwtVpToken,
		keys: dcSdJwtDcqlQuery
    });
	const result = await fn;
	t.is(result.result['result'], 'OK');
});


test('dc+sd-jwt claims in both disclosure and payload', async (t) => {
	const dcSdJwtDcqlQuery = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"discount_from_voucher"
						]
					},
					claims: [
						{
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						},
						{
							path: [
								"iss"
							],
							values: [
								"https://issuer1.zenswarm.forkbomb.eu/credential_issuer"
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: dcSdJwtVpToken,
		keys: dcSdJwtDcqlQuery
    });
	const result = await fn;
	t.is(result.result['result'], 'OK');
});

test('dc+sd-jwt failing beacuse dcql query ask for more claims than the presented one', async (t) => {
	const dcSdJwtDcqlQueryNonExistingClaim = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"discount_from_voucher"
						]
					},
					claims: [
						{
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						},
						{
							path: [
								'non_existing_claim'
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: dcSdJwtVpToken,
		keys: dcSdJwtDcqlQueryNonExistingClaim
    });
	const error = await t.throwsAsync(fn);
	t.true(stripAnsiCodes((error as Error).message).startsWith(
`0 | 
1 | Prepare: validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | 
3 | Given I have a 'string' named 'vp_token'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/dcql@${packageJson.version} Error: Invalid vp_token: it does not satisfy the dcql_query
`));
});

test('dc+sd-jwt failing beacuse dcql query ask for more credentials than the presented one', async (t) => {
	const dcSdJwtDcqlQueryNonExistingCredential = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"discount_from_voucher"
						]
					},
					claims: [
						{
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						}
					]
				},
				{
					id: "my_other_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"some_random_stuff"
						]
					},
					claims: [
						{
							path: [
								"stuff"
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: dcSdJwtVpToken,
		keys: dcSdJwtDcqlQueryNonExistingCredential
    });
	const error = await t.throwsAsync(fn);
	t.true(stripAnsiCodes((error as Error).message).startsWith(
`0 | 
1 | Prepare: validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 | 
3 | Given I have a 'string' named 'vp_token'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/dcql@${packageJson.version} Error: Invalid vp_token: it does not satisfy the dcql_query
`));
});

test.skip('dc+sd-jwt & ldp_vc', async (t) => {
	const dcSdJwtLdpVcDcqlQuery = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"discount_from_voucher"
						]
					},
					claims: [
						{
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						}
					]
				},
				{
					id: "my_ldpvc_credential",
					format: "ldp_vc",
					meta: {
						type_values: [
							[
								"questionnaire"
							]
						]
					},
					claims: [
						{
							path: [
								"credentialSubject",
								"formid"
							]
						},
						{
							path: [
								"credentialSubject",
								"instanceid"
							]
						},
						{
							path: [
								"credentialSubject",
								"submissiondate"
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: {
			vp_token: JSON.stringify({...dcSdJwtVpTokenJson, ...ldpVcVpTokenJson})
		},
		keys: dcSdJwtLdpVcDcqlQuery
    });
	const result = await fn;
	t.is(result.result['result'], 'OK');
});
