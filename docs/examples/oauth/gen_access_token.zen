Rule unknown ignore
Scenario 'http': url encode

Given I have a 'string dictionary' named 'json_body'
Given I have a 'string dictionary' named 'request'

When I create the http get parameters from 'json_body' using percent encoding
When I move 'json_body' to 'body' in 'request'

Then print the 'request'

Then I send request 'request' and send server_data 'server_data' and generate access token and output into 'result'
