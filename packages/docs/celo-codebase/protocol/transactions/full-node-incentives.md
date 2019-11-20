# Full Node Incentives

Full nodes are incentivized to serve light clients by gateway fees which are attach to transaction by the light clients they serve.

Gateway fees are specified by a pair of optional fields, the `GatewayFee` and `GatewayFeeRecipient` which are specified by light clients to pay the full node which is acting as their gateway to the Celo network. Light clients will set the `GatewayFeeRecipient` to the Etherbase of the serving full node and the `GatewayFee` field to a small amount of Celo Gold, or alternative fee currency, which will be sent to the recipient as atomically as part of the transaction. Note that the gateway fee is paid even if the transaction is reverted.

Full nodes set their Etherbase with the `--etherbase` flag to indicate the address to which gateway fees should be sent and the `--gatewayfee` flag to indicate the minimum fee value they will accept. Light clients can send a `GetEtherbase` message to retrieve this address. (Retrieval for the gateway fee value is work in progress) By default, full nodes refuse to process a transaction if the `GasFeeRecipient` field is not set to the full node's Etherbase or the `GatewayFee` value is not high enough.

While many APIs of full nodes are not explicitly incentivized, not accepting light client connections or disconnecting non-transaction RPC calls will cause those peers to seek other full nodes to serve their transactions. Light clients will choose full node peers based on location, cost, reliability and other factors.
