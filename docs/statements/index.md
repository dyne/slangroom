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



## db plugin
| open/connect | params               | phrase                                  |
| ------------ | -------------------- | --------------------------------------- |
| connect      | statement            | execute sql statement                   |
| connect      | statement,parameters | execute parametrized sql statement      |
| connect      | record,table         | read the record of the table            |
| connect      | variable,name,table  | save the variable in the database table |

## ethereum plugin
| open/connect | params         | phrase                                           |
| ------------ | -------------- | ------------------------------------------------ |
| connect      | address        | read the ethereum nonce                          |
| connect      | transaction_id | read the ethereum bytes                          |
| connect      | address        | read the ethereum balance                        |
| connect      | addresses      | read the ethereum balance                        |
| connect      |                | read the ethereum suggested gas price            |
| connect      | transaction    | read the ethereum transaction id after broadcast |
| connect      | sc             | read the erc20 decimals                          |
| connect      | sc             | read the erc20 name                              |
| connect      | sc             | read the erc20 symbol                            |
| connect      | sc,address     | read the erc20 balance                           |
| connect      | sc             | read the erc20 total supply                      |
| connect      | transaction_id | read the erc721 id in transaction                |
| connect      |                | read the erc721 owner                            |
| connect      |                | read the erc721 asset                            |

## fs plugin
| open/connect | params       | phrase                     |
| ------------ | ------------ | -------------------------- |
| connect      | path         | download and extract       |
|              | path         | read file content          |
|              | path         | read verbatim file content |
|              | content,path | store in file              |
|              | path         | list directory content     |
|              | path         | verify file exists         |
|              | path         | verify file does not exist |

## git plugin
| open/connect | params | phrase                |
| ------------ | ------ | --------------------- |
| open         |        | verify git repository |
| connect      | path   | clone repository      |
| open         | commit | create new git commit |

## helpers plugin
| open/connect | params            | phrase                 |
| ------------ | ----------------- | ---------------------- |
|              | object,path       | manipulate and get     |
|              | object,path,value | manipulate and set     |
|              | object,sources    | manipulate and merge   |
|              | object,paths      | manipulate and omit    |
|              | array,values      | manipulate and concat  |
|              | array             | manipulate and compact |
|              | object,properties | manipulate and pick    |
|              |                   | manipulate and delete  |

## http plugin
| open/connect | params         | phrase               |
| ------------ | -------------- | -------------------- |
| connect      |                | do get               |
| connect      | headers        | do get               |
| connect      |                | do sequential get    |
| connect      | headers        | do sequential get    |
| connect      |                | do parallel get      |
| connect      | headers        | do parallel get      |
| connect      |                | do same get          |
| connect      | headers        | do same get          |
| connect      |                | do post              |
| connect      | headers        | do post              |
| connect      | object         | do post              |
| connect      | object,headers | do post              |
| connect      |                | do sequential post   |
| connect      | headers        | do sequential post   |
| connect      | object         | do sequential post   |
| connect      | object,headers | do sequential post   |
| connect      |                | do parallel post     |
| connect      | headers        | do parallel post     |
| connect      | object         | do parallel post     |
| connect      | object,headers | do parallel post     |
| connect      |                | do same post         |
| connect      | headers        | do same post         |
| connect      | object         | do same post         |
| connect      | object,headers | do same post         |
| connect      |                | do put               |
| connect      | headers        | do put               |
| connect      | object         | do put               |
| connect      | object,headers | do put               |
| connect      |                | do sequential put    |
| connect      | headers        | do sequential put    |
| connect      | object         | do sequential put    |
| connect      | object,headers | do sequential put    |
| connect      |                | do parallel put      |
| connect      | headers        | do parallel put      |
| connect      | object         | do parallel put      |
| connect      | object,headers | do parallel put      |
| connect      |                | do same put          |
| connect      | headers        | do same put          |
| connect      | object         | do same put          |
| connect      | object,headers | do same put          |
| connect      |                | do patch             |
| connect      | headers        | do patch             |
| connect      | object         | do patch             |
| connect      | object,headers | do patch             |
| connect      |                | do sequential patch  |
| connect      | headers        | do sequential patch  |
| connect      | object         | do sequential patch  |
| connect      | object,headers | do sequential patch  |
| connect      |                | do parallel patch    |
| connect      | headers        | do parallel patch    |
| connect      | object         | do parallel patch    |
| connect      | object,headers | do parallel patch    |
| connect      |                | do same patch        |
| connect      | headers        | do same patch        |
| connect      | object         | do same patch        |
| connect      | object,headers | do same patch        |
| connect      |                | do delete            |
| connect      | headers        | do delete            |
| connect      | object         | do delete            |
| connect      | object,headers | do delete            |
| connect      |                | do sequential delete |
| connect      | headers        | do sequential delete |
| connect      | object         | do sequential delete |
| connect      | object,headers | do sequential delete |
| connect      |                | do parallel delete   |
| connect      | headers        | do parallel delete   |
| connect      | object         | do parallel delete   |
| connect      | object,headers | do parallel delete   |
| connect      |                | do same delete       |
| connect      | headers        | do same delete       |
| connect      | object         | do same delete       |
| connect      | object,headers | do same delete       |

## json-schema plugin
| open/connect | params                | phrase        |
| ------------ | --------------------- | ------------- |
|              | json_data,json_schema | validate json |

## location plugin
| open/connect | params | phrase                                 |
| ------------ | ------ | -------------------------------------- |
|              |        | get the current location               |
|              |        | get the current location href          |
|              |        | get the current location protocol      |
|              |        | get the current location host          |
|              |        | get the current location hostname      |
|              |        | get the current location port          |
|              |        | get the current location pathname      |
|              |        | get the current location search params |
|              |        | get the current location hash          |
|              |        | reload the current page                |
|              | url    | replace the current location           |
|              | url    | assign the current location            |
|              | url    | redirect to the url                    |
|              |        | go back in history                     |
|              |        | go forward in history                  |
|              | index  | go to a specific page in history       |
|              |        | get the history length                 |
|              | url    | open the url in a new window           |

## oauth plugin
| open/connect | params                                | phrase                               |
| ------------ | ------------------------------------- | ------------------------------------ |
|              | request,server_data                   | generate access token                |
|              | request,server_data                   | verify request parameters            |
|              | request,server_data                   | generate authorization code          |
|              | request,client,server_data,expires_in | generate request uri                 |
|              | token,server_data                     | get authorization details from token |
|              | request_uri,data,server_data          | add data to authorization details    |
|              | request_uri,server_data               | get redirect_uri from request_uri    |

## pocketbase plugin
| open/connect | params                              | phrase                    |
| ------------ | ----------------------------------- | ------------------------- |
| connect      |                                     | start pb client           |
| connect      |                                     | start capacitor pb client |
|              | my_credentials                      | login                     |
|              |                                     | refresh token             |
|              | email                               | ask password reset        |
|              | list_parameters                     | get some records          |
|              | show_parameters                     | get one record            |
|              | create_parameters,record_parameters | create record             |
|              | update_parameters,record_parameters | update record             |
|              | delete_parameters                   | delete record             |
|              | url,send_parameters                 | send request              |

## qrcode plugin
| open/connect | params | phrase         |
| ------------ | ------ | -------------- |
|              | text   | create qr code |

## rdf plugin
| open/connect | params     | phrase                            |
| ------------ | ---------- | --------------------------------- |
|              | dictionary | generate serialized canonical rdf |

## redis plugin
| open/connect | params     | phrase                         |
| ------------ | ---------- | ------------------------------ |
| connect      | key,object | write object into key in redis |
| connect      | key        | read key from redis            |
| connect      | key        | delete key from redis          |

## shell plugin
| open/connect | params  | phrase           |
| ------------ | ------- | ---------------- |
|              | command | execute in shell |

## timestamp plugin
| open/connect | params | phrase                                    |
| ------------ | ------ | ----------------------------------------- |
|              |        | fetch the local timestamp in milliseconds |
|              |        | fetch the local timestamp in seconds      |

## wallet plugin
| open/connect | params                                        | phrase                  |
| ------------ | --------------------------------------------- | ----------------------- |
|              | jwk,object,holder,fields                      | create vc sd jwt        |
|              | verifier_url,issued_vc,disclosed,nonce,holder | present vc sd jwt       |
|              | verifier_url,issued_vc,nonce,issuer           | verify vc sd jwt        |
|              |                                               | create p-256 key        |
|              | sk                                            | create p-256 public key |
|              | token                                         | pretty print sd jwt     |

## zencode plugin
| open/connect | params                      | phrase          |
| ------------ | --------------------------- | --------------- |
|              | script,data,keys            | execute zencode |
|              | script,data,keys,extra,conf | execute zencode |

