Rule unknown ignore
Scenario 'ethereum': Store an object on eth

Given I connect to 'ethereum' and send address 'address' and read the ethereum nonce and output into 'ethereum_nonce'
Given I connect to 'ethereum' and read the suggested gas price and output into 'gas_price'

# from slangroom
Given I have a 'ethereum nonce'
Given I have a 'gas price'

# from keys
Given I have the 'keyring'

# from data
Given I have a 'ethereum address' named 'storage contract'
Given I have a 'string' named 'to be stored'
Given I have a 'gas limit'

# create the signed transaction to store the data
When I create the ethereum transaction to 'storage contract'
When I use the ethereum transaction to store 'to be stored'
When I create the signed ethereum transaction for chain 'fabt'

Then print the 'signed ethereum transaction'

Then I connect to 'ethereum' and send transaction 'signed_ethereum_transaction' and read the ethereum transaction id after broadcast and output into 'transaction_id'
