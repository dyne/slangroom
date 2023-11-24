export * from '@slangroom/core/lexer';
export * from '@slangroom/core/parser';
export * from '@slangroom/core/lexer';
export * from '@slangroom/core/visitor';
export * from '@slangroom/core/plugin';
export * from '@slangroom/core/slangroom';

/**
 * The Core of Slangroom.
 *
 * @remarks
 * - The lexer module defines the lexer that is used to split up strings of
 *   characters of a line by whitespace, while keeping the whitespace intact
 *   inside identifiers.  It generates tokens with position information.
 *
 * - The parser module defines the parser that is used to parse the list of
 *   tokens of a line.  It creates a CST (Concrete Syntax Tree) with a list of
 *   possible matches of plugin definitions.
 *
 * - The visitor module defines the visitor that is used to generate an AST
 *   (Abstract Syntax Tree) out of the given CST.  It keeps the information of
 *   what needs to be provided to which plugin definition.
 *
 * - The plugin module defines the plugins subsystem, where a plugin can define
 *   multiple plugin definitions, each of which defines a unique plugin
 *   definition inside of that parcitular plugin.
 *
 * - The Slangroom module is the entrypoint to the whole system.  It uses a list
 *   of plugins to execute a contract as if the custom statements defined in a
 *   contract is actually run by Zenroom itself, a seamless experience.
 *
 * @example
 * Let's define an example plugin with a single, simple plugin definitons:
 * ```ts
 * // file: my-plugin.ts
 * import {Plugin} from "@slangroom/core";
 *
 * const p = new Plugin();
 *
 * p.new("love asche", ctx => {
 * 	return ctx.pass("everything is okay, and this is my return value");
 * });
 *
 * export const myPlugin = p;
 * ```
 *
 * The callback function of the plugin definition above would be ran when a
 * custom statements of the following possible forms are matched (everything but
 * the "I" is case-insensitive):
 * ```
 * Given I love Asche
 * Then I love Asche
 * Given I love Asche and output into 'result'
 * Then I love Asche and output into 'other_result'
 * ```
 *
 * The statements starting with Given are executed before the actual Zenroom
 * execution takes place, and statements starting with Then are executed after
 * the actual execution takes place.
 *
 * We can later use that definion with a Slangroom instance:
 * ```ts
 * import {Slangroom} from '@slangroom/core';
 * import {myPlugin} from "my-plugin";
 *
 * const sl = new Slangroom(myPlugin);
 *
 * const {result, logs} = sl.execute(contract, params)
 * ```
 *
 * @example
 * Let's define an example plugin with parameters now:
 * ```ts
 * // file: my-plugin.ts
 * import {Plugin} from "@slangroom/core";
 *
 * const p = new Plugin();
 *
 * p.new(["first_number", "second_number"], "add up", ctx => {
 * 	const first = ctx.fetch("first_number");
 * 	if (typeof first !== "number")
 * 		return ctx.fail("first_number must be a number")
 * 	const second = ctx.fetch("second_number");
 * 	if (typeof second !== "number")
 * 		return ctx.fail("second_number must be a number")
 * 	return ctx.pass(first + second);
 * });
 *
 * export const myPlugin = p;
 * ```
 *
 * The callback function of the plugin definition above would be ran when a
 * custom statements of the following possible forms are matched (everything but
 * the "I" is case-insensitive):
 * ```
 * Given I send first_number 'ident1' and send second_number 'ident2' and add up
 * Then I send first_number 'ident1' and send second_number 'ident2' and add up
 * Given I send second_number 'ident1' and send first_number 'ident2' and add up
 * Then I send second_number 'ident1' and send first_number 'ident2' and add up
 * Given I send first_number 'ident1' and send second_number 'ident2' and add up and output into 'result'
 * Then I send first_number 'ident1' and send second_number 'ident2' and add up and output into 'another_result'
 * Given I send second_number 'ident1' and send first_number 'ident2' and add up and add up and output into 'result'
 * Then I send second_number 'ident1' and send first_number 'ident2' and add up and add up and output into 'other_result'
 * ```
 *
 * The statements starting with Given are executed before the actual Zenroom
 * execution takes place, and statements starting with Then are executed after
 * the actual execution takes place.  The first four statements don't make much
 * sense, as the whole reason we created this plugin is to use its return value,
 * but, but this is allowed by design.
 *
 * We can later use that definion with a Slangroom instance:
 * ```ts
 * import {Slangroom} from '@slangroom/core';
 * import {myPlugin} from "my-plugin";
 *
 * const sl = new Slangroom(myPlugin);
 *
 * const {result, logs} = sl.execute(contract, params)
 * ```
 *
 * @example
 * Let's define an example plugin with parameters and open now:
 * ```ts
 * // file: my-plugin.ts
 * import {Plugin} from "@slangroom/core";
 *
 * const p = new Plugin();
 *
 * p.new("open", ["content"], "write to file", ctx => {
 * 	const path = ctx.fetchOpen()[0];
 * 	const cont = ctx.fetch("content");
 * 	if (typeof cont !== "string")
 * 		return ctx.fail("content must be a number");
 * 	const {result, error} = fs.writeToFile(path, cont);
 * 	if (error)
 * 		return ctx.fail(error);
 * 	return ctx.pass(result);
 * });
 *
 * export const myPlugin = p;
 * ```
 *
 * The callback function of the plugin definition above would be ran when a
 * custom statements of the following possible forms are matched (everything but
 * the "I" is case-insensitive):
 * ```
 * Given I open 'ident1' and send content 'ident1' and write to file
 * Then I open 'ident1' and send content 'ident1' and write to file
 * Given I open 'ident1' and send content 'ident1' and write to file and output into 'result'
 * Then I open 'ident1' and send content 'ident1' and write to file and ountput into 'other_result'
 * ```
 *
 * The statements starting with Given are executed before the actual Zenroom
 * execution takes place, and statements starting with Then are executed after
 * the actual execution takes place.
 *
 * We can later use that definion with a Slangroom instance:
 * ```ts
 * import {Slangroom} from '@slangroom/core';
 * import {myPlugin} from "my-plugin";
 *
 * const sl = new Slangroom(myPlugin);
 *
 * const {result, logs} = sl.execute(contract, params)
 * ```
 *
 * @example
 * We can also just define a plugin that uses connect and a phrase:
 * ```ts
 * // file: my-plugin.ts
 * import {Plugin} from "@slangroom/core";
 *
 * const p = new Plugin();
 *
 * p.new("connect", "ping once", ctx => {
 * 	const host = ctx.fetchConnect()[0];
 * 	const {result, error} = net.pingHost(host);
 * 	if (error)
 * 		return ctx.fail(error);
 * 	return ctx.pass(result);
 * });
 *
 * export const myPlugin = p;
 * ```
 *
 * The callback function of the plugin definition above would be ran when a
 * custom statements of the following possible forms are matched (everything but
 * the "I" is case-insensitive):
 * ```
 * Given I connect to 'ident1' and ping once
 * Then I connect to 'ident1' and ping once
 * Given I connect to 'ident1' and ping once and output into 'result'
 * Then I connect to 'ident1' and ping once and output into 'other_result'
 * ```
 *
 * The statements starting with Given are executed before the actual Zenroom
 * execution takes place, and statements starting with Then are executed after
 * the actual execution takes place.
 *
 * We can later use that definion with a Slangroom instance:
 * ```ts
 * import {Slangroom} from '@slangroom/core';
 * import {myPlugin} from "my-plugin";
 *
 * const sl = new Slangroom(myPlugin);
 *
 * const {result, logs} = sl.execute(contract, params)
 * ```
 *
 * @packageDocumentation
 */
