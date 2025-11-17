// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import test from 'ava';
import { Slangroom } from '@slangroom/core';
import { dcql } from '@slangroom/dcql';
// read the version from the package.json
import packageJson from '@slangroom/dcql/package.json' with { type: 'json' };

const stripAnsiCodes = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').replace(/[ \t]+(?=\r?\n|$)/g, '');

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

const ldpVcVpToken = {
	vp_token: JSON.stringify(ldpVcVpTokenJson)
}

const dcSdJwtVpTokenJson = {
	my_dcsdjwt_credential: [
		"eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCJ9.eyJfc2QiOiBbIk5UWGptakduN09rRTBqZ3N1aVc0YWgzcllQVVVEYlJvcHg0T1BUbkRrLUUiXSwgIl9zZF9hbGciOiAic2hhLTI1NiIsICJjbmYiOiB7Imp3ayI6IHsiY3J2IjogIlAtMjU2IiwgImt0eSI6ICJFQyIsICJ4IjogInpKLTR1d0VWVlYxQW9GcW1yZVlzUlh1SjhGbzVHRVVUeTZ0aklBdjdUcFkiLCAieSI6ICJWb1h2YTNUSkdzSjluOVlXNXcwamUwenpTaGZic3dBZ3pIcjVMRkJIM2xnIn19LCAiZXhwIjogMTc5MjgzMTU2MywgImlhdCI6IDE3NjEyOTU1NjMsICJpc3MiOiAiaHR0cHM6Ly9pc3N1ZXIxLnplbnN3YXJtLmZvcmtib21iLmV1L2NyZWRlbnRpYWxfaXNzdWVyIiwgIm5iZiI6IDE3NjEyOTU1NjMsICJzdWIiOiAiZGlkOmR5bmU6c2FuZGJveC5zaWducm9vbTo0S0V5bVdnTERVZjFMTmNrZXhZOTZkZkt6NXZINzlkaURla2dMTVI5RldwSCIsICJ0eXBlIjogImRpc2NvdW50X2Zyb21fdm91Y2hlciJ9.4-SvoLq0DnQ399X8LkR7U_TBv7okJQmc0y7ShWBgYWryVs50YbkKH5cM4sar_QmPFTNqdOXgERzJMjqzcQVBUQ~WyJUX2doS3EyVlpwUFNGU19meVV3UTJRIiwgImhhc19kaXNjb3VudF9mcm9tX3ZvdWNoZXIiLCAyMF0~eyJhbGciOiJFUzI1NiIsInR5cCI6ImtiK2p3dCJ9.eyJhdWQiOiJkZWNlbnRyYWxpemVkX2lkZW50aWZpZXI6ZGlkOmR5bmU6c2FuZGJveC5nZW5lcmljaXNzdWVyOjRYeDVyQVdBRzJpREVnVlFSY0VKUFN1bmFpbXU2blczZGgzUlZKOHFydVo2I2VzMjU2X3B1YmxpY19rZXkiLCJpYXQiOjE3NjEzMTA5NDAsIm5vbmNlIjoiYjk1NGQ3ZjM3YmFmYWRlNTcyNmMwMDc4ZmUzNzU4MmE2NzUwZjY5YWRjMmJjMDZiYzE5MmI0ZTgyNjYwZWU1OSIsInNkX2hhc2giOiJXbFVBSDhuY3ZNU0VZNE9tbWN3SjRhUV9zdEZoVWNua3AxeVEtR0taMno0In0.z8e_ls0hIocjkNP9zlM6higpks3FfhIubkTaCmx26Lcic9gHAHtiOrZ_zmol3nGyf3Dy51mlBvvhojHrftm2ww"
	]
}
const dcSdJwtVpToken = {
	vp_token: JSON.stringify(dcSdJwtVpTokenJson)
}

const dcSdJwtPIDVpTokenJson = {
	my_dcsdjwt_PID_credential: [
		"eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCJ9.eyJfc2QiOiBbIjMxZ29vOWRLeXlRZmdZSGxtQUMzOWg5dl9RNUJaak5DMmxiNENjSE1iSjQiLCAiM1VMWk03WURaYjFNT3F4cC15eks4TTROM3JVQ0UzMWR3NHVRMTJHMlBZayIsICI3Zk5ubVo5Zy1wWkgycl9KQU5JVGpLRmFnMlgyaFdkaFp2SWlZX0h2Z19VIiwgImdUN3ktTnRmamtVUWpEaHdjalV6X0t3VENEQTJ3RTJzc3NtbWhIOXZQU0kiLCAiVVdzOVdURFJkb18tNWgyUjMtQzBrTXpWTFpRNGg3eFBzU2F3YVJVY0xqcyIsICJwRlZ2WkVlUURwZkQ0OHl2SUU3SHdaX2Zxa2VSUEZhVnI3bVRRenQ0aVFRIiwgIkcxb25iRlFvN214cC1tanNIcXZISm4xNE1fYTlZYWhCR29QOEtTWGFkZTgiXSwgIl9zZF9hbGciOiAic2hhLTI1NiIsICJjbmYiOiB7Imp3ayI6IHsiY3J2IjogIlAtMjU2IiwgImt0eSI6ICJFQyIsICJ4IjogInpKLTR1d0VWVlYxQW9GcW1yZVlzUlh1SjhGbzVHRVVUeTZ0aklBdjdUcFkiLCAieSI6ICJWb1h2YTNUSkdzSjluOVlXNXcwamUwenpTaGZic3dBZ3pIcjVMRkJIM2xnIn19LCAiZXhwIjogMTc5NDkwNjMzMSwgImlhdCI6IDE3NjMzNzAzMzEsICJpc3MiOiAiaHR0cHM6Ly9jaS50ZXN0LmRpZHJvb20uY29tL2NyZWRlbnRpYWxfaXNzdWVyIiwgIm5iZiI6IDE3NjMzNzAzMzEsICJzdWIiOiAiZGlkOmR5bmU6c2FuZGJveC5zaWducm9vbTo0S0V5bVdnTERVZjFMTmNrZXhZOTZkZkt6NXZINzlkaURla2dMTVI5RldwSCIsICJ0eXBlIjogIlZlcmlmaWFibGVQSURTREpXVCJ9.o0hZ_fn6-4b4bcfMtVRPHrvdlLhZU_fffd3WPi5YO65kQz_PumY4PPsAWGFK8KPP4DABgg816QDgUhlVkt578w~WyJtVEo5WUNZT3MwaDB5T2NocU5ILWRnIiwgImdpdmVuX25hbWUiLCAiQm9iIl0~WyI2ZXRoTDNITTVxNEtoblVFTFNtYzVnIiwgImZhbWlseV9uYW1lIiwgIkRvZSJd~WyJJbmk4NnZJQkxVZk41YUQ2QVowNWNBIiwgImFkZHJlc3MiLCB7ImNvdW50cnkiOiAiSVQiLCAiZm9ybWF0dGVkIjogIlZpYSBBbGVzc2FuZHJvIE1hbnpvbmkgMTIsIFR1cmluLCAxMDEyMiwgUGllZG1vbnQsIEl0YWx5IiwgImxvY2FsaXR5IjogIlR1cmluIiwgInBvc3RhbF9jb2RlIjogIjEwMTIyIiwgInJlZ2lvbiI6ICJQaWVkbW9udCIsICJzdHJlZXRfYWRkcmVzcyI6ICJWaWEgQWxlc3NhbmRybyBNYW56b25pIDEyIn1d~WyI4VHcxanAzOWc0UWR5eGUwMkVWNHRnIiwgImFnZV9vdmVyXzE4IiwgdHJ1ZV0~eyJhbGciOiJFUzI1NiIsInR5cCI6ImtiK2p3dCJ9.eyJhdWQiOiJkZWNlbnRyYWxpemVkX2lkZW50aWZpZXI6ZGlkOmR5bmU6c2FuZGJveC5nZW5lcmljaXNzdWVyOkU1eVRaeEMxeXFQZGpxamtQNkhpY0R6MlJMRUdQcTdzZWlMMzFyeDRqN3ByIiwiaWF0IjoxNzYzMzcwNDg0LCJub25jZSI6ImI2NmM1YmVlZjkyZjY0ZTdmN2RhMGM1NmYyOGE4MmY1NmIzZDljMzEyMGRlYzFlNTY5M2Q2MzRiMmE1NGJmY2QiLCJzZF9oYXNoIjoiTVN4Rk5HNUJjS0hzVUc3enBVc2F5TmxpcUJjaDQ2cUVMa3RfeXpzRlgzcyJ9.fuyVqfGwkDpdaHFZBHVeZRcLDxzTXpfPkKfZgPxHu8wSCIYzJOIHKqMLGoF8vBzdWQvJ9i_FzWxu-zJ5YRPZ2A"
	]
}
const dcSdJwtPIDVpToken = {
	vp_token: JSON.stringify(dcSdJwtPIDVpTokenJson)
}

const VALIDATE = `
Prepare 'res': validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'

Given I have a 'string dictionary' named 'res'
Then print the 'res'
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
	const out = {
		res: {
			my_dcsdjwt_credential: [
				{
					has_discount_from_voucher: 20
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
	t.deepEqual(result.result, out, JSON.stringify(result));
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
	const out = {
		res: {
			my_dcsdjwt_credential: [
				{
					has_discount_from_voucher: 20,
					iss: "https://issuer1.zenswarm.forkbomb.eu/credential_issuer"
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
	t.deepEqual(result.result, out, JSON.stringify(result));
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
1 | Prepare 'res': validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |
3 | Given I have a 'string dictionary' named 'res'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/dcql@${packageJson.version} Error: Invalid vp_token: it does not satisfy the dcql_query:
`), (error as Error).message);
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
1 | Prepare 'res': validate the vp_token against dcql_query where vp_token is 'vp_token', dcql_query is 'dcql_query'
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2 |
3 | Given I have a 'string dictionary' named 'res'

Error colors:
 - error
 - suggested words
 - missing words
 - extra words

Slangroom @slangroom/dcql@${packageJson.version} Error: Invalid vp_token: it does not satisfy the dcql_query:
`), (error as Error).message);
});

test('ldp_vc', async (t) => {
	const dcqlQuery = {
		dcql_query: {
			credentials: [
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
	const out = {
		res: {
			my_ldpvc_credential: [
				{
					credentialSubject: {
						formid: "aducB7jazEVpH3hHdLBzzM",
						instanceid: "uuid:c2492b4d-bdbb-3554-88c0-383dca60482a",
						submissiondate: "2025-10-16T14:04:41.643318+00:00"
					}
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: ldpVcVpToken,
		keys: dcqlQuery
    });
	const result = await fn;
	t.deepEqual(result.result, out, JSON.stringify(result));
});

test('dc+sd-jwt & ldp_vc', async (t) => {
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
	const out = {
		res: {
			my_ldpvc_credential: [
				{
					credentialSubject: {
						formid: "aducB7jazEVpH3hHdLBzzM",
						instanceid: "uuid:c2492b4d-bdbb-3554-88c0-383dca60482a",
						submissiondate: "2025-10-16T14:04:41.643318+00:00"
					}
				}
			],
			my_dcsdjwt_credential: [
				{
					has_discount_from_voucher: 20
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
	t.deepEqual(result.result, out, JSON.stringify(result));
});

test('complex query', async (t) => {
	const complexQuery = {
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
							id: "a",
							path: [
								"has_discount_from_voucher"
							],
							values: [
								20,
								30
							]
						},
						{
							id: "b",
							path: [
								"iss"
							]
						},
						{
							id: "c",
							path: [
								"sub"
							],
							values: [
								"did:example.com"
							]
						}
					],
					claim_sets: [
						["a", "b"],
						["a", "c"]
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
			],
			credential_sets: [
				{
					options: [
						[
							"my_ldpvc_credential"
						]
					],
					required: false
				}
			]
		}
	}
	const out = {
		res: {
			my_dcsdjwt_credential: [
				{
					has_discount_from_voucher: 20,
					iss: "https://issuer1.zenswarm.forkbomb.eu/credential_issuer"
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
        data: dcSdJwtVpToken,
		keys: complexQuery
    });
	const result = await fn;
	t.deepEqual(result.result, out, JSON.stringify(result));
});

test('query that ask for a object claim', async (t) => {
	const objectQuery = {
		dcql_query: {
			credentials: [
				{
					id: "my_dcsdjwt_PID_credential",
					format: "dc+sd-jwt",
					meta: {
						vct_values: [
							"VerifiablePIDSDJWT"
						]
					},
					claims: [
						{
							path: [
								"given_name"
							]
						},
						{
							path: [
								"family_name"
							]
						},
						{
							path: [
								"address",
							]
						},
						{
							path: [
								"age_over_18"
							],
							values: [
								true
							]
						},
						{
							path: [
								"iss"
							],
							values: [
								"https://ci.test.didroom.com/credential_issuer"
							]
						}
					]
				}
			]
		}
	}
	const slangroom = new Slangroom(dcql);
	const fn = slangroom.execute(VALIDATE, {
		data: dcSdJwtPIDVpToken,
		keys: objectQuery
	});
	const result = await fn;
	const out = {
		res: {
			my_dcsdjwt_PID_credential: [
				{
					given_name: "Bob",
					family_name: "Doe",
					age_over_18: true,
					address: {
						country:"IT",
						formatted:"Via Alessandro Manzoni 12, Turin, 10122, Piedmont, Italy",
						locality:"Turin",
						postal_code:"10122",
						region:"Piedmont",
						street_address:"Via Alessandro Manzoni 12"
					},
					iss: "https://ci.test.didroom.com/credential_issuer"
				}
			]
		}
	}
	t.deepEqual(result.result, out, JSON.stringify(result));
});
