Rule unknown ignore

# this reutrn the window.location object
# singular element of location can be obtained by adding
# the reuqest element, i.e. href, protocol, host, hostname, port,
# pathname, search params, hash, after 'location' like
# Given I get the current location href and output into 'result'

Given I get the current location and output into 'location'

Given I have a 'string dictionary' named 'location'
Then print data
