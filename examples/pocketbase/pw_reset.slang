Rule unknown ignore

Given I connect to 'pb_address' and start pb client
Given I send my_credentials 'my_credentials' and login

Given I send email 'email' and ask password reset and output into 'result'

Given I have a 'string dictionary' named 'result'
Then print the 'result'
