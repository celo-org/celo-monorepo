[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["kit"](_kit_.md)

# Module: "kit"

## Index

### Classes

* [ContractKit](../classes/_kit_.contractkit.md)

### Interfaces

* [NetworkConfig](../interfaces/_kit_.networkconfig.md)

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: ReadOnlyWallet): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:38](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L38)*

Creates a new instance of `ContractKit` give a nodeUrl

**`optional`** wallet to reuse or add a wallet different that the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`wallet?` | ReadOnlyWallet | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3, `wallet`: ReadOnlyWallet): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:49](https://github.com/celo-org/celo-monorepo/blob/contractkit-v1.2.2/packages/sdk/contractkit/src/kit.ts#L49)*

Creates a new instance of the `ContractKit` with a web3 instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`web3` | Web3 | - | Web3 instance  |
`wallet` | ReadOnlyWallet | new LocalWallet() | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*
