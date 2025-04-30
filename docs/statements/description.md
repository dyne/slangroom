<!--
SPDX-FileCopyrightText: 2024 Dyne.org foundation

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Reference
## Compose a slangroom statement

There are two possible main format for slangroom statements the `Given & Then` (more similar to zencode format) and the `Prepare & Compute` (more readable).

### Given & Then format

In this case Slangroom statements must always starts with `Given I` or `Then I` token followed by at most four parts that are used for:
1. connect to external endpoint or open a file, respectively by using the `connect to 'endpoint'` or `open the 'file'`;
2. specify the parameters, done with the form `send ${parameters_name} 'parameters_value'` that must be done for all needed parameters;
3. specify what is the action accomplished by the statement, this is what describe the statement and it is different for all the statements;
4. save the result of the statements to a varaible, done with `output into 'result_variable'`.

All these parts are connected between them with the `and` token. For example with the following statement:
```gherkin
Given I connect to 'endpoint' and send object 'post_body' and send headers 'post_headers' and do post and output into 'response'
```
slangroom connects to the `endpoint`, set the parameters `object` to `post_body` value and `headers` to `post_headers` value, do a post (explicited by `do post`) and save the result of the post in the variable `response`.

### Prepare & Compute format

In this case Slangroom statements must always starts with `Prepare` (the old `Given I`) or `Compute` (the old `Then I`) tokens followed by at most five parts that are used for:
1. save the result of the statements to a varaible, done with `'result_variable'` right after `Prepare` or `Compute`;
2. a colum `:`;
3. connect to external endpoint or open a file, respectively by using the `connect to 'endpoint'` or `open the 'file'`;
4. specify what is the action accomplished by the statement, this is what describe the statement and it is different for all the statements;
5. specify the parameters, done with the form `with ${parameters_name} 'parameters_value', ${another_parameters_name} 'another_parameters_value', ...`  or `where ${parameters_name} is 'parameters_value', ${another_parameters_name} is 'another_parameters_value'` that must be done for all needed parameters;

The example written above using the Prepare & Compute format become:
```gherkin
Prepare 'response': connect to 'endpoint' and do post with object 'post_body', headers 'post_headers'
# or
Prepare 'response': connect to 'endpoint' and do post where object is 'post_body', headers is 'post_headers'
```

## Tables of all slangroom statements

In the following tables you will find all slangroom statements divided in the open/connect, parameters and action parts the output part can always be added and it is not related to the statment itself.
A blank entrance in the table means that that part of the statement is not needed, for example in
```gherkin
Given I fetch the local timestamp in seconds
# equally
Prepare: fetch the local timestamp in seconds
```
neither the open/connect part nor the parameters part are present.


