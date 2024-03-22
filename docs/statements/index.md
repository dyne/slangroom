# Tables of all slangroom statements

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
| connect      | object         | do get               |
| connect      | headers        | do get               |
| connect      | object,headers | do get               |
| connect      |                | do sequential get    |
| connect      | object         | do sequential get    |
| connect      | headers        | do sequential get    |
| connect      | object,headers | do sequential get    |
| connect      |                | do parallel get      |
| connect      | object         | do parallel get      |
| connect      | headers        | do parallel get      |
| connect      | object,headers | do parallel get      |
| connect      |                | do same get          |
| connect      | object         | do same get          |
| connect      | headers        | do same get          |
| connect      | object,headers | do same get          |
| connect      |                | do post              |
| connect      | object         | do post              |
| connect      | headers        | do post              |
| connect      | object,headers | do post              |
| connect      |                | do sequential post   |
| connect      | object         | do sequential post   |
| connect      | headers        | do sequential post   |
| connect      | object,headers | do sequential post   |
| connect      |                | do parallel post     |
| connect      | object         | do parallel post     |
| connect      | headers        | do parallel post     |
| connect      | object,headers | do parallel post     |
| connect      |                | do same post         |
| connect      | object         | do same post         |
| connect      | headers        | do same post         |
| connect      | object,headers | do same post         |
| connect      |                | do put               |
| connect      | object         | do put               |
| connect      | headers        | do put               |
| connect      | object,headers | do put               |
| connect      |                | do sequential put    |
| connect      | object         | do sequential put    |
| connect      | headers        | do sequential put    |
| connect      | object,headers | do sequential put    |
| connect      |                | do parallel put      |
| connect      | object         | do parallel put      |
| connect      | headers        | do parallel put      |
| connect      | object,headers | do parallel put      |
| connect      |                | do same put          |
| connect      | object         | do same put          |
| connect      | headers        | do same put          |
| connect      | object,headers | do same put          |
| connect      |                | do patch             |
| connect      | object         | do patch             |
| connect      | headers        | do patch             |
| connect      | object,headers | do patch             |
| connect      |                | do sequential patch  |
| connect      | object         | do sequential patch  |
| connect      | headers        | do sequential patch  |
| connect      | object,headers | do sequential patch  |
| connect      |                | do parallel patch    |
| connect      | object         | do parallel patch    |
| connect      | headers        | do parallel patch    |
| connect      | object,headers | do parallel patch    |
| connect      |                | do same patch        |
| connect      | object         | do same patch        |
| connect      | headers        | do same patch        |
| connect      | object,headers | do same patch        |
| connect      |                | do delete            |
| connect      | object         | do delete            |
| connect      | headers        | do delete            |
| connect      | object,headers | do delete            |
| connect      |                | do sequential delete |
| connect      | object         | do sequential delete |
| connect      | headers        | do sequential delete |
| connect      | object,headers | do sequential delete |
| connect      |                | do parallel delete   |
| connect      | object         | do parallel delete   |
| connect      | headers        | do parallel delete   |
| connect      | object,headers | do parallel delete   |
| connect      |                | do same delete       |
| connect      | object         | do same delete       |
| connect      | headers        | do same delete       |
| connect      | object,headers | do same delete       |

## oauth plugin
| open/connect | params                                | phrase                      |
| ------------ | ------------------------------------- | --------------------------- |
|              | request,server_data                   | generate access token       |
|              | request,server_data                   | generate authorization code |
|              | request,client,server_data,expires_in | generate request uri        |
|              | token,server_data                     | get claims from token       |

## pocketbase plugin
| open/connect | params                              | phrase           |
| ------------ | ----------------------------------- | ---------------- |
|              | pb_address                          | create pb_client |
|              | my_credentials                      | login            |
|              | list_parameters                     | ask records      |
|              | show_parameters                     | ask record       |
|              | create_parameters,record_parameters | create record    |
|              | update_parameters,record_parameters | update record    |
|              | delete_parameters                   | delete record    |
|              | url,send_parameters                 | send request     |

## qrcode plugin
| open/connect | params | phrase         |
| ------------ | ------ | -------------- |
|              | text   | create qr code |

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

