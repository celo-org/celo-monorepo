# Gas Pricing

## Gas Price Minimum

The Celo protocol uses a gas market based on [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), which establishes a gas price minimum that moves up and down in response to demand to provide elasticity in transaction throughput.

Every transaction is required to pay at or above the gas price minimum to be included in a block. The required portion of gas fee, known as the base, is equal to `gas price minimum * gas used` and is sent to the [Infrastructure Fund](../governance.md). The rest of the gas fee, known as the tip, is rewarded to the validator that proposes the block.

<!--- DO NOT MERGE: I don't think the following is true based on https://github.com/celo-org/celo-blockchain/blob/6de2cdd871ea710d84a084b138aa52e13300e842/core/tx_pool.go#L687 --->

As you might expect, transactions that offer a gas price above the current minimum gas price are accepted while transactions that fail to meet this minimum will be held in the mempool until the minimum gas price falls below the transaction gas price.

The gas price minimum will respond to demand, increasing during periods of sustained demand, but allowing temporary spikes in gas demand without price shocks. As part of this system Celo aims to have blocks filled at target utilization rate, for example 50% of the total block gas limit. When blocks are being filled more than the target, the gas price minimum will be raised until demand subsides. If blocks are being filled at less than the target rate, the gas price minimum will decrease until demand rises. Block producers only receive the tip and not the base of the gas fee, which provides incentives for them maintain the target utilization. For more information on this system, read [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559).

As a benefit, this system provides an each way for clients to determine what gas price they should pay. A `GasPriceMinimum` smart contract provides access to read the current gas price minimum, providing a reasonable basis for the gas price of transaction. During congestion, or when the client wants to ensure that their transaction is mined quickly, they may add a tip to the gas price of their transaction which will encourage block validators to include it in the next block.

In the Celo protocol, the gas price minimum is calculated as follows:

$$MinGasPrice_1 = MinGasPrice_0 \times ( 1 + ( BlockDensity_0 − TargetDensity ) \times AdjustementSpeed )$$

With:

- $$MinGasPrice_1$$: New minimum gas price

- $$MinGasPrice_0$$: Old minimum gas price

- $$BlockDensity_0$$: Block density \(total gas / blockGasLimit\)

- $$TargetDensity$$: Governable block target density

- $$AdjustementSpeed$$: Governable adjustment speed
