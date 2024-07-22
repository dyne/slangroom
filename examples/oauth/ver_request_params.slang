Rule unknown ignore

Given I have a 'string' named 'client_id'
Given I have a 'string' named 'request_uri'
Given I have a 'string dictionary' named 'request'

When I set 'body' to 'client_id=' as 'string'
When I append the 'client_id' to 'body'
When I append the string '&request_uri=' to 'body'
When I append the 'request_uri' to 'body'
When I move 'body' in 'request'

Then print the 'request'

Then I send request 'request' and send server_data 'server_data' and verify request parameters
