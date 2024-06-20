Rule unknown ignore
Scenario 'ethereum': read transaction

Given I connect to 'ethereum' and send transaction_id 'tag' and read the ethereum bytes and output into 'hex_result'

Given I have a 'hex' named 'hex_result'
When I create the string from the ethereum bytes named 'hex_result'
When I rename the 'string' to 'string_result'
Then print data
