# Full Node Incentives

The Celo protocol supports **gateway fees**. These fees create an incentive for node operators to run a full node that is not a validator and act as a 'gateway', i.e. answer requests and forward transactions, on behalf of light clients. This is important since it is likely that the vast majority of nodes in the Celo network will be light or ultralight clients, and so the vast majority of full nodes will need to be deployed to service them rather than act as validators. In contrast, in Ethereum, there are few incentives to run a full node that is not mining and so few nodes serve light clients, resulting in a poor experience for mobile wallets.

![](https://storage.googleapis.com/celo-website/docs/network-detail.png)

A pair of optional fields in the transaction structure, the `GatewayFee` and `GatewayFeeRecipient`, may be specified by light clients to identify the full node which is acting as their gateway to the Celo network. Light clients will set the `GatewayFeeRecipient` to the Etherbase of the serving full node and the `GatewayFee` field to a small amount of Celo Gold, or [alternative fee currency](erc20-transaction-fees.md), which will be sent to the recipient at the point that the transaction is processed and included in a block. Note that the gateway fee is paid even if the transaction is reverted.

Full nodes set their Etherbase with the `--etherbase` flag to indicate the address to which gateway fees should be sent and the `--gatewayfee` flag to indicate the minimum fee value they will accept. Light clients can send a `GetEtherbase` message to retrieve this address. (Retrieval for the gateway fee value is work in progress) By default, full nodes refuse to process a transaction if the `GatewayFeeRecipient` field is not set to the full node's Etherbase or the `GatewayFee` value is not high enough.

While many APIs of full nodes are not explicitly incentivized, not accepting light client connections or disconnecting non-transaction RPC calls will cause those peers to seek other full nodes to serve their transactions. Light clients will choose full node peers based on location, cost, reliability and other factors.
