# Gas Pricing

## Gas Price Minimum

Celo uses a gas market based on [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559). The protocol establishes a **gas price minimum** that applies to all transactions regardless of which validator processes them.

The gas price minimum will respond to demand, increasing during periods of sustained demand, but allowing temporary spikes in gas demand without price shocks. The Celo protocol aims to have blocks filled at the `target_density`, a certain proportion of the total block gas limit. When blocks are being filled more than the target, the gas price minimum will be raised until demand subsides. If blocks are being filled at less than the target rate, the gas price minimum will decrease until demand rises. The rate of change is determined by a governable parameter, `adjustment_speed`.

In the Celo protocol, the gas price minimum for the next block is calculated based on the current block:

```text
gas_price_minimum' = gas_price_minimum * (1 + ((total_gas_used / block_gas_limit) − target_density) * adjustment_speed) + 1
```

Every transaction is required to pay for gas at or above the gas price minimum in order to be processed. Full nodes will reject transactions whose gas price is below the current gas price minimum, and will discard outstanding transactions if the gas price minimum subsequently falls below the gas price that the transactions specify.

## Selecting a Transaction Gas Price

This approach provides a simple mechanism for clients to determine what gas price they should pay. A `GasPriceMinimum` smart contract provides access to the current gas price minimum. For example, with the parameters specified for the Celo testnets, a gas price of 3x the current gas price minimum will be valid in all scenarios for the following 30 seconds.

When the client wants to ensure that their transaction is processed quickly, they may wish to further increase the gas price to encourage validators proposing new blocks to include it in preference to other transactions.

## Transaction Fee Recipients

The required portion of gas fee, known as the **base**, is set as `base = gas_price_minimum * gas_used` and is sent to the [Community Fund](../proof-of-stake/epoch-rewards/community-fund.md). The rest of the gas fee, known as the **tip**, is rewarded to the validator that proposes the block. Block producers only receive the tip and not the base of the gas fee, which means that they do not have an incentive to artificially inflate the gas price minimum by flooding the network with transactions.

