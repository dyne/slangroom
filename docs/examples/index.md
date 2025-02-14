
# Slangroom examples

## db plugin examples

### read a record from a table
::: code-group
<<< @/../examples/db/read_from_table.slang{3 gherkin:line-numbers}
<<< @/../examples/db/read_from_table.data.json{json}
<<< @/../examples/db/read_from_table.keys.json{json}
:::

### save a variable in a database table
::: code-group
<<< @/../examples/db/save_to_table.slang{12 gherkin:line-numbers}
<<< @/../examples/db/save_to_table.data.json{json}
<<< @/../examples/db/save_to_table.keys.json{json}
:::

### execute generic sql statements
::: code-group
<<< @/../examples/db/sql_statement.slang{3 gherkin:line-numbers}
<<< @/../examples/db/sql_statement.data.json{json}
<<< @/../examples/db/sql_statement.keys.json{json}
:::

### execute generic sql statements with parameters
::: code-group
<<< @/../examples/db/sql_statement_with_params.slang{3 gherkin:line-numbers}
<<< @/../examples/db/sql_statement_with_params.data.json{json}
<<< @/../examples/db/sql_statement_with_params.keys.json{json}
:::

## ethereum plugin examples

### complex example
::: code-group
<<< @/../examples/ethereum/complex.slang{4,5,26 gherkin:line-numbers}
<<< @/../examples/ethereum/complex.data.json{json}
<<< @/../examples/ethereum/complex.keys.json{json}
:::

### read the ethereum balance
::: code-group
<<< @/../examples/ethereum/read_balance.slang{3-4 gherkin:line-numbers}
<<< @/../examples/ethereum/read_balance.data.json{json}
<<< @/../examples/ethereum/read_balance.keys.json{json}
:::

### read the ethereum transaction body
::: code-group
<<< @/../examples/ethereum/read_bytes.slang{4 gherkin:line-numbers}
<<< @/../examples/ethereum/read_bytes.data.json{json}
<<< @/../examples/ethereum/read_bytes.keys.json{json}
:::

### read the ethereum suggested gas price
::: code-group
<<< @/../examples/ethereum/read_gas.slang{4 gherkin:line-numbers}
<<< @/../examples/ethereum/read_gas.data.json{json}
<<< @/../examples/ethereum/read_gas.keys.json{json}
:::

### read the ethereum nonce
::: code-group
<<< @/../examples/ethereum/read_nonce.slang{4 gherkin:line-numbers}
<<< @/../examples/ethereum/read_nonce.data.json{json}
<<< @/../examples/ethereum/read_nonce.keys.json{json}
:::

### read the ethereum transaction id after broadcast
::: code-group
<<< @/../examples/ethereum/read_tx_id.slang{3 gherkin:line-numbers}
<<< @/../examples/ethereum/read_tx_id.data.json{json}
<<< @/../examples/ethereum/read_tx_id.keys.json{json}
:::

## fs plugin examples

### verify file exists or does not exist
::: code-group
<<< @/../examples/fs/exist.slang{2,3 gherkin:line-numbers}
<<< @/../examples/fs/exist.data.json{json}
<<< @/../examples/fs/exist.keys.json{json}
:::

### list a directory content
::: code-group
<<< @/../examples/fs/ls.slang{2 gherkin:line-numbers}
<<< @/../examples/fs/ls.data.json{json}
<<< @/../examples/fs/ls.keys.json{json}
:::

### read json file
::: code-group
<<< @/../examples/fs/read_json.slang{2 gherkin:line-numbers}
<<< @/../examples/fs/read_json.data.json{json}
<<< @/../examples/fs/read_json.keys.json{json}
:::

### read string file
::: code-group
<<< @/../examples/fs/read_verbatim.slang{2 gherkin:line-numbers}
<<< @/../examples/fs/read_verbatim.data.json{json}
<<< @/../examples/fs/read_verbatim.keys.json{json}
:::

### store in file
::: code-group
<<< @/../examples/fs/store.slang{6 gherkin:line-numbers}
<<< @/../examples/fs/store.data.json{json}
<<< @/../examples/fs/store.keys.json{json}
:::

## git plugin examples

### clone repository
::: code-group
<<< @/../examples/git/clone_repository.slang{3 gherkin:line-numbers}
<<< @/../examples/git/clone_repository.data.json{json}
<<< @/../examples/git/clone_repository.keys.json{json}
:::

### create new git commit
::: code-group
<<< @/../examples/git/commit.slang{3 gherkin:line-numbers}
<<< @/../examples/git/commit.data.json{json}
<<< @/../examples/git/commit.keys.json{json}
:::

### verify git repository
::: code-group
<<< @/../examples/git/verify_git.slang{3 gherkin:line-numbers}
<<< @/../examples/git/verify_git.data.json{json}
<<< @/../examples/git/verify_git.keys.json{json}
:::

## helpers plugin examples

### manipulate and compact
::: code-group
<<< @/../examples/helpers/compact.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/compact.data.json{json}
<<< @/../examples/helpers/compact.keys.json{json}
:::

### manipulate and concat
::: code-group
<<< @/../examples/helpers/concat.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/concat.data.json{json}
<<< @/../examples/helpers/concat.keys.json{json}
:::

### manipulate and get
::: code-group
<<< @/../examples/helpers/get.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/get.data.json{json}
<<< @/../examples/helpers/get.keys.json{json}
:::

### manipulate and merge
::: code-group
<<< @/../examples/helpers/merge.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/merge.data.json{json}
<<< @/../examples/helpers/merge.keys.json{json}
:::

### manipulate and omit
::: code-group
<<< @/../examples/helpers/omit.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/omit.data.json{json}
<<< @/../examples/helpers/omit.keys.json{json}
:::

### manipulate and pick
::: code-group
<<< @/../examples/helpers/pick.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/pick.data.json{json}
<<< @/../examples/helpers/pick.keys.json{json}
:::

### manipulate and set
::: code-group
<<< @/../examples/helpers/set.slang{3 gherkin:line-numbers}
<<< @/../examples/helpers/set.data.json{json}
<<< @/../examples/helpers/set.keys.json{json}
:::

## http plugin examples

### http get
::: code-group
<<< @/../examples/http/get.slang{2 gherkin:line-numbers}
<<< @/../examples/http/get.data.json{json}
<<< @/../examples/http/get.keys.json{json}
:::

### http get with headers
::: code-group
<<< @/../examples/http/get_with_headers.slang{2 gherkin:line-numbers}
<<< @/../examples/http/get_with_headers.data.json{json}
<<< @/../examples/http/get_with_headers.keys.json{json}
:::

### http post
::: code-group
<<< @/../examples/http/post.slang{2 gherkin:line-numbers}
<<< @/../examples/http/post.data.json{json}
<<< @/../examples/http/post.keys.json{json}
:::

### http post with header
::: code-group
<<< @/../examples/http/post_with_headers.slang{2 gherkin:line-numbers}
<<< @/../examples/http/post_with_headers.data.json{json}
<<< @/../examples/http/post_with_headers.keys.json{json}
:::

## json-schema plugin examples

### validate json
::: code-group
<<< @/../examples/json-schema/validate.slang{3 gherkin:line-numbers}
<<< @/../examples/json-schema/validate.data.json{json}
<<< @/../examples/json-schema/validate.keys.json{json}
:::

## location plugin examples

### assign the current location
::: code-group
<<< @/../examples/location/assign.slang{3 gherkin:line-numbers}
<<< @/../examples/location/assign.data.json{json}
<<< @/../examples/location/assign.keys.json{json}
:::

### go back in history
::: code-group
<<< @/../examples/location/go_back.slang{3 gherkin:line-numbers}
<<< @/../examples/location/go_back.data.json{json}
<<< @/../examples/location/go_back.keys.json{json}
:::

### go forward in history
::: code-group
<<< @/../examples/location/go_forward.slang{3 gherkin:line-numbers}
<<< @/../examples/location/go_forward.data.json{json}
<<< @/../examples/location/go_forward.keys.json{json}
:::

### go to a specific page in history
::: code-group
<<< @/../examples/location/go_to_index.slang{3 gherkin:line-numbers}
<<< @/../examples/location/go_to_index.data.json{json}
<<< @/../examples/location/go_to_index.keys.json{json}
:::

### get the history length
::: code-group
<<< @/../examples/location/history_length.slang{3 gherkin:line-numbers}
<<< @/../examples/location/history_length.data.json{json}
<<< @/../examples/location/history_length.keys.json{json}
:::

### get the current location
::: code-group
<<< @/../examples/location/location.slang{9 gherkin:line-numbers}
<<< @/../examples/location/location.data.json{json}
<<< @/../examples/location/location.keys.json{json}
:::

### open the url in a new window
::: code-group
<<< @/../examples/location/new_window.slang{3 gherkin:line-numbers}
<<< @/../examples/location/new_window.data.json{json}
<<< @/../examples/location/new_window.keys.json{json}
:::

### redirect to the url
::: code-group
<<< @/../examples/location/redirect.slang{3 gherkin:line-numbers}
<<< @/../examples/location/redirect.data.json{json}
<<< @/../examples/location/redirect.keys.json{json}
:::

### reload the page
::: code-group
<<< @/../examples/location/reload.slang{3 gherkin:line-numbers}
<<< @/../examples/location/reload.data.json{json}
<<< @/../examples/location/reload.keys.json{json}
:::

### replace the current location
::: code-group
<<< @/../examples/location/replace.slang{3 gherkin:line-numbers}
<<< @/../examples/location/replace.data.json{json}
<<< @/../examples/location/replace.keys.json{json}
:::

## oauth plugin examples

### add data to authorization details
::: code-group
<<< @/../examples/oauth/add_data.slang{3 gherkin:line-numbers}
<<< @/../examples/oauth/add_data.data.json{json}
<<< @/../examples/oauth/add_data.keys.json{json}
:::

### generate access token
::: code-group
<<< @/../examples/oauth/gen_access_token.slang{12 gherkin:line-numbers}
<<< @/../examples/oauth/gen_access_token.data.json{json}
<<< @/../examples/oauth/gen_access_token.keys.json{json}
:::

### generate authorization code
::: code-group
<<< @/../examples/oauth/gen_auth_code.slang{3 gherkin:line-numbers}
<<< @/../examples/oauth/gen_auth_code.data.json{json}
<<< @/../examples/oauth/gen_auth_code.keys.json{json}
:::

### generate request uri
::: code-group
<<< @/../examples/oauth/gen_request_uri.slang{3 gherkin:line-numbers}
<<< @/../examples/oauth/gen_request_uri.data.json{json}
<<< @/../examples/oauth/gen_request_uri.keys.json{json}
:::

### get authorization details
::: code-group
<<< @/../examples/oauth/get_auth_details.slang{3 gherkin:line-numbers}
<<< @/../examples/oauth/get_auth_details.data.json{json}
<<< @/../examples/oauth/get_auth_details.keys.json{json}
:::

### verify request parameters
::: code-group
<<< @/../examples/oauth/ver_request_params.slang{15 gherkin:line-numbers}
<<< @/../examples/oauth/ver_request_params.data.json{json}
<<< @/../examples/oauth/ver_request_params.keys.json{json}
:::

## pocketbase plugin examples

### create a record
::: code-group
<<< @/../examples/pocketbase/create_record.slang{6 gherkin:line-numbers}
<<< @/../examples/pocketbase/create_record.data.json{json}
<<< @/../examples/pocketbase/create_record.keys.json{json}
:::

### delete a record
::: code-group
<<< @/../examples/pocketbase/delete_record.slang{6 gherkin:line-numbers}
<<< @/../examples/pocketbase/delete_record.data.json{json}
<<< @/../examples/pocketbase/delete_record.keys.json{json}
:::

### get one record
::: code-group
<<< @/../examples/pocketbase/get_one_record.slang{5 gherkin:line-numbers}
<<< @/../examples/pocketbase/get_one_record.data.json{json}
<<< @/../examples/pocketbase/get_one_record.keys.json{json}
:::

### get some records
::: code-group
<<< @/../examples/pocketbase/get_some_records.slang{5 gherkin:line-numbers}
<<< @/../examples/pocketbase/get_some_records.data.json{json}
<<< @/../examples/pocketbase/get_some_records.keys.json{json}
:::

### login
::: code-group
<<< @/../examples/pocketbase/login.slang{5 gherkin:line-numbers}
<<< @/../examples/pocketbase/login.data.json{json}
<<< @/../examples/pocketbase/login.keys.json{json}
:::

### password reset
::: code-group
<<< @/../examples/pocketbase/pw_reset.slang{6 gherkin:line-numbers}
<<< @/../examples/pocketbase/pw_reset.data.json{json}
<<< @/../examples/pocketbase/pw_reset.keys.json{json}
:::

### refresh token
::: code-group
<<< @/../examples/pocketbase/refresh_token.slang{5 gherkin:line-numbers}
<<< @/../examples/pocketbase/refresh_token.data.json{json}
<<< @/../examples/pocketbase/refresh_token.keys.json{json}
:::

### send request
::: code-group
<<< @/../examples/pocketbase/send_request.slang{5 gherkin:line-numbers}
<<< @/../examples/pocketbase/send_request.data.json{json}
<<< @/../examples/pocketbase/send_request.keys.json{json}
:::

### start pb client
::: code-group
<<< @/../examples/pocketbase/start_pb.slang{3 gherkin:line-numbers}
<<< @/../examples/pocketbase/start_pb.data.json{json}
<<< @/../examples/pocketbase/start_pb.keys.json{json}
:::

### update a record
::: code-group
<<< @/../examples/pocketbase/update_record.slang{6 gherkin:line-numbers}
<<< @/../examples/pocketbase/update_record.data.json{json}
<<< @/../examples/pocketbase/update_record.keys.json{json}
:::

## qrcode plugin examples

### create qr code
::: code-group
<<< @/../examples/qrcode/qr_code.slang{3 gherkin:line-numbers}
<<< @/../examples/qrcode/qr_code.data.json{json}
<<< @/../examples/qrcode/qr_code.keys.json{json}
:::

## redis plugin examples

### delete key from redis
::: code-group
<<< @/../examples/redis/delete.slang{3 gherkin:line-numbers}
<<< @/../examples/redis/delete.data.json{json}
<<< @/../examples/redis/delete.keys.json{json}
:::

### read key from redis
::: code-group
<<< @/../examples/redis/read.slang{3 gherkin:line-numbers}
<<< @/../examples/redis/read.data.json{json}
<<< @/../examples/redis/read.keys.json{json}
:::

### write object into key in redis
::: code-group
<<< @/../examples/redis/write.slang{3 gherkin:line-numbers}
<<< @/../examples/redis/write.data.json{json}
<<< @/../examples/redis/write.keys.json{json}
:::

## shell plugin examples

### execute in shell
::: code-group
<<< @/../examples/shell/execute.slang{3 gherkin:line-numbers}
<<< @/../examples/shell/execute.data.json{json}
<<< @/../examples/shell/execute.keys.json{json}
:::

## timestamp plugin examples

### fetch the local timestamp
::: code-group
<<< @/../examples/timestamp/fetch_timestamp.slang{3-4 gherkin:line-numbers}
<<< @/../examples/timestamp/fetch_timestamp.data.json{json}
<<< @/../examples/timestamp/fetch_timestamp.keys.json{json}
:::

## zencode plugin examples

###  execute zencode
::: code-group
<<< @/../examples/zencode/execute_zencode.slang{3 gherkin:line-numbers}
<<< @/../examples/zencode/execute_zencode.data.json{json}
<<< @/../examples/zencode/execute_zencode.keys.json{json}
:::

