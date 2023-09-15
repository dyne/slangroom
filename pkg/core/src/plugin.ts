import type { ZenroomParams, JsonableObject } from '@slangroom/shared';

/**
 * A plugin that must be executed **before** the actual Zenroom execution takes
 * place.
 *
 * The plugin is defined using a single parameter which is a callback,
 * named [execute], which takes in the necessary parameters from [BeforeParams]
 * and optionally returns a [ZenroomParams].
 */
export class BeforePlugin {
	constructor(
		readonly execute: (
			params: BeforeParams
		) => Promise<void> | void | Promise<ZenroomParams> | ZenroomParams
	) { }
}

/**
 * A plugin that must be executed **after** the actual Zenroom execution takes
 * place.
 *
 * The plugin is defined using a single parameter which is a callback,
 * named [execute], which takes in the necessary parameters from [AfterParams].
 */
export class AfterPlugin {
	constructor(readonly execute: (params: AfterParams) => Promise<void> | void) { }
}

/**
 * The parameters passed down to [BeforePlugin]'s callback.
 *
 * [statement] is the ignored statement for each iteration.
 * [params] is the original parameters passed to Zenroom, if any.
 */
export type BeforeParams = {
	readonly statement: string;
	readonly params: ZenroomParams | undefined;
};

/**
 * The parameters passed down to [BeforePlugin]'s callback.
 * [statement] is the ignored statement for each iteration.
 * [params] is the original parameters passed to Zenroom, if any.
 * [result] is the result of the actual Zenroom execution.
 */
export type AfterParams = {
	readonly statement: string;
	readonly params: ZenroomParams | undefined;
	readonly result: JsonableObject;
};
