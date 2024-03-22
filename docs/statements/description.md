## Compose a slangroom statement

Slangroom statements must always starts with `Given I` or `Then I` token followed by at most four parts that are used for:
1. connect to external endpoint or open a file, respectively by using the `connect to 'endpoint'` or `open the 'file'`;
2. send parameters, done with the form `send ${parameters_name} 'parameters_value'` that must be done for all needed parameters;
3. specify what is the action accomplished by the statement, this is wath describe the statement and it is different for all the statements;
4. save the result of the statements to a varaible, done with `output into 'result_variable'`.

All these parts are connected between them with the `and` token. For example with the following statement:
```gherkin
Given I connect to 'endpoint' and send object 'post_body' and send headers 'post_headers' and do post and output into 'response'
```
slangroom connects with the `endpoint` and set the parameters `object` to `post_body` value and `headers` to `post_headers` value, do a post (explicited by `do post`) and save the result of the post in the variable `response`.

In the following tables you will find all slangroom statements divided in the first three parts since the foruth one can always be added and it is not related to the statment itself.
A blank entrance in the table means that that part of the statement is not needed, for example in
```gherkin
Given I fetch the local timestamp in seconds
```
neither the open/connect part nor the parameters part are present.

