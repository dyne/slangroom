/**
 * Any object that can be convertable to a JSON string.
 */
export type Jsonable = JsonablePrimitive | JsonableObject | JsonableArray;

/**
 * Any object that is convertable to a JSON string that doesn't end up
 * being any object or array.
 */
export type JsonablePrimitive = string | number | boolean | null | undefined;

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
