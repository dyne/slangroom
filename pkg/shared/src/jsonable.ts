// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Any object that can be convertable to a JSON string.
 */
export type Jsonable = JsonablePrimitive | JsonableObject | JsonableArray;

/**
 * Any object that is convertable to a JSON string that doesn't end up
 * being any object or array.
 */
export type JsonablePrimitive = string | number | boolean | null;

/**
 * Any object that is convertable to a JSON string that ends up being
 * an object.
 */
export type JsonableObject = { [K: string]: Jsonable };

/**
 * Any object that is convertable to a JSON string that ends up being
 * an array.
 */
export type JsonableArray = Jsonable[];
