# Full Node Incentives

Full nodes are incentivized to serve light clients by receiving transaction fees \(note a minimum base fee is set which is shared with the infrastructure fund\). Transactions are augmented with a `gas_recipient` field, which light clients set to the address of the full node through which they route a transaction.

Full nodes can use the `--etherbase` field to set the account to which it wishes to receive transaction fees. Light clients can send a `GetEtherbase` message to retrieve this address. By default, full nodes refuse to process transactions whose `gas_recipient` field is not set to the expected value.

While many APIs of full nodes are not explicitly incentivized, not accepting light client connections or disconnecting non-transaction RPC calls will cause those peers to seek other full nodes that do. Light clients will choose full node peers based on location, cost, reliability and other factors.
