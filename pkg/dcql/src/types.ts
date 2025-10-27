// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

export const DcSdJwtArraySchema = z.array(z.string().nonempty());
export const LdpVcArraySchema = z.array(
	z.object({
		"@context": z.array(z.string()),
		type: z.array(z.string()),
		verifiableCredential: z.array(
			z.object({
				"@context": z.array(z.string()),
				type: z.array(z.string()),
				proof: z.object({
					created: z.string(),
					cryptosuite: z.string(),
					proofPurpose: z.string(),
					proofValue: z.string(),
					type: z.string(),
					verificationMethod: z.string()
				}),
				credentialSubject: z.object().catchall(z.any()),
				issuer: z.string(),
				validUntil: z.string()
			}).catchall(z.any())).nonempty(),
		holder: z.string(),
		proof: z.object({
			challenge: z.string(),
			created: z.string(),
			cryptosuite: z.string(),
			domain: z.string(),
			proofPurpose: z.string(),
			proofValue: z.string(),
			type: z.string(),
			verificationMethod: z.string()
		}).catchall(z.any()),
	}).catchall(z.any())
);
export type LdpVcElementType = z.infer<typeof LdpVcArraySchema.element>;
export type LdpVcVerifiableCredentialelementType = LdpVcElementType["verifiableCredential"][number];

const Presentation = z.union([DcSdJwtArraySchema, LdpVcArraySchema]);
export const VpTokenSchema = z.record(
	// spec requires id value: non-empty string with alnum, underscore or hyphen.
	z.string().regex(/^[A-Za-z0-9_-]+$/, {
		message: "credential id must be alphanumeric, underscore or hyphen",
	}),
	Presentation
);
export type VpToken = z.infer<typeof VpTokenSchema>;

// JWK
export type JWK = {
	kty: string;
	use?: string;
	key_ops?: string[];
	alg?: string;
	kid?: string;
	// For EC keys
	crv?: string;
	x?: string;
	y?: string;
	// For RSA keys
	n?: string;
	e?: string;
	// Optional extra fields
	[prop: string]: any;
}

// zencode scripts output
export type ExtractKeyOutput = {
	result: {
		iss: string;
		jwk: JWK;
	},
	logs: string;
}

export type Es256dcsdjwtOutput = {
	result: {
		disclosures: [string, string, string | number | boolean][];
		payload: Record<string, unknown>;
	},
	logs: string;
}
