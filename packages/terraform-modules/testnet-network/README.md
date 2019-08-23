# testnet-network

This Terraform module exists as a measure of safely creating and destroying
VPC networks. Because `testnet` may sometimes be on the `default` VPC network
that is used by other resources, we need to make sure that `terraform destroy`ing
the testnet module will not result in the default VPC network being destroyed.
Rather than declaring the network as a `resource` in `testnet`, we instead declare
it as a `data` source. This prevents the network from being deleted upon `terraform destroy`,
but also prevents the network from being created. Terraform lacks basic
conditionals to directly implement this logic in the `testnet` module.

This module is only intended to be used by `celotool`, which only creates/destroys
a network if it is not the `default` VPC.
