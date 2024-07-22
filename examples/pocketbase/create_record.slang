Rule unknown ignore

Given I connect to 'pb_address' and start pb client
Given I send my_credentials 'my_credentials' and login

Given I send create_parameters 'create_parameters' and send record_parameters 'record_parameters' and create record and output into 'result'

Given I have a 'string dictionary' named 'result'
Then print the 'result'
