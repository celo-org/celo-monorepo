# Validator proxy

Validator uptime is essential for the health of the Celo blockchain.  To help with validator uptime, operators can use the proxy nodes, which will provide added security for the validator.  It allows the validator to run within a private network, and communicate to the rest of the Celo network via the proxy.

Also, as for the Celo client 1.2 release, we will support multiple proxies per validator.  This provides better uptime for the validator, in the case when one of the proxies go down.  Also, it will help with making each proxy ip address less public by only sharing that with a subset of the other validators.

There are two ways to specify the proxy information to a validator.  It can be done on validator startup via the command line argument, or by the rpc api when the validator is running.d to loss of funds, slashing due to double signing, etc. Here are some recommendations:

### Command Line

Instructions on how to add proxies via the command line is described in the [Getting Started guide for mainnet](running-a-validator-in-mainnet#deploy-a-validator-machine).

### RPC API

* `istanbul.addProxy(<proxy's internal enode URL>, <proxy's external enode URL>)` can be used on the validator to add a proxy to the validator's proxy set
* `istanbul.removeProxy(<proxy's internal enode URL>)` canm be used on the validator to remove a proxy from the validator's proxy set
* `istanbul.proxies` can be used on the validator to list the validator's proxy set

* `istanbul.proxiedValidators` can be used on the proxies to list the proxied validators
