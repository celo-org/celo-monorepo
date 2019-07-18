# Gas Pricing

The Celo protocol uses a minimum gas price which moves as a function of block congestion. The required transaction fee, `minimum gas price * gas amount,` is split between the infrastructure fund and the `gas_recipient` . The rest of the transaction fee is given to the `gas_recipient.` As you might expect, transactions that offer a gas price above the current minimum gas price are accepted while transactions that fail to meet this minimum will be held in the mempool until the minimum gas price falls below the transaction gas price.

The primary reason for the departure from ethereum's transaction fee protocol comes from a requirement for incentive realignment due to the new incentive structure in the Celo protocol design. Without this minimum gas price, full nodes which propagate light client transactions to validators would receive 100% of the transaction fees. This means that transaction construction would be free for full nodes as would a denial-of-service attack on network validators. Therefore, some amount of the transaction fees must not be returned to the full node. Additionally, a simple percentage would not work because it incentivizes side-channels between light clients and full nodes.

Another constraint that fueled this change was the desire for low transaction fees in order to best serve the target population while maintaining high enough transaction costs to make denial-of-service attacks expensive.

This approach, which is based on [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), provides all of these features. We expect the minimum gas price to be low \(especially in the early days of the protocol\) but, thanks to congestion based pricing, will quickly increase in response to congestion spikes. Additionally, basing pricing on congestion rather than historic gas pricing allows adjustments following gas price spikes to occur more quickly and makes client-side price suggestion much simpler.

The minimum gas price is calculated as follows:

$$MinGasPrice_1 = MinGasPrice_0 ∗ ( 1 + ( BlockDensity_0 − TargetDensity ) \* AdjustementSpeed )$$

With:

- $$MinGasPrice_1$$: New minimum gas price

- $$MinGasPrice_0$$: Old minimum gas price

- $$BlockDensity_0$$: Block density \(total gas / blockGasLimit\)

- $$TargetDensity$$: Governable block target density

- $$AdjustementSpeed$$: Governable adjustment speed
