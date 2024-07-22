Rule unknown ignore

Given I fetch the local timestamp in seconds and output into 'result_in_seconds'
Given I fetch the local timestamp in milliseconds and output into 'result_in_milliseconds'

Given I have a 'string' named 'result_in_seconds'
Given I have a 'string' named 'result_in_milliseconds'
Then print the 'result_in_seconds'
Then print the 'result_in_milliseconds'
