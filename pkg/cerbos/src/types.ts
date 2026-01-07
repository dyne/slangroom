// SPDX-FileCopyrightText: 2025 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod';

type Value =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Value }
	| Value[];

const valueSchema: z.ZodType<Value> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(valueSchema),
    z.record(z.string(), valueSchema),
  ])
);

export const principalSchema = z.object({
	id: z.string(),
	roles: z.array(z.string()),
	attr: z.record(z.string(), valueSchema).optional(),
	attributes: z.record(z.string(), valueSchema).optional(), // deprecated, prefer attr
	policyVersion: z.string().optional(),
	scope: z.string().optional(),
});

export const resourceSchema = z.object({
	kind: z.string(),
	id: z.string(),
	attr: z.record(z.string(), valueSchema).optional(),
	attributes: z.record(z.string(), valueSchema).optional(), // deprecated, prefer attr
	policyVersion: z.string().optional(),
	scope: z.string().optional(),
});

export const actionSchema = z.string();
