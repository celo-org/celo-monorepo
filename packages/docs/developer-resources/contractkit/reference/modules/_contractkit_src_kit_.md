# External module: "contractkit/src/kit"

## Index

### Classes

* [ContractKit](../classes/_contractkit_src_kit_.contractkit.md)

### Interfaces

* [KitOptions](../interfaces/_contractkit_src_kit_.kitoptions.md)
* [NetworkConfig](../interfaces/_contractkit_src_kit_.networkconfig.md)

### Functions

* [newKit](_contractkit_src_kit_.md#newkit)
* [newKitFromWeb3](_contractkit_src_kit_.md#newkitfromweb3)

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: [ReadOnlyWallet](../interfaces/_contractkit_src_wallets_wallet_.readonlywallet.md)): *[ContractKit](../classes/_contractkit_src_kit_.contractkit.md)‹›*

*Defined in [packages/contractkit/src/kit.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L38)*

Creates a new instance of `ContractKit` give a nodeUrl

**`optional`** wallet to reuse or add a wallet different that the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`wallet?` | [ReadOnlyWallet](../interfaces/_contractkit_src_wallets_wallet_.readonlywallet.md) | - |

**Returns:** *[ContractKit](../classes/_contractkit_src_kit_.contractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3, `wallet?`: [ReadOnlyWallet](../interfaces/_contractkit_src_wallets_wallet_.readonlywallet.md)): *[ContractKit](../classes/_contractkit_src_kit_.contractkit.md)‹›*

*Defined in [packages/contractkit/src/kit.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/kit.ts#L50)*

Creates a new instance of `ContractKit` give a web3 instance

**`optional`** wallet to reuse or add a wallet different that the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`web3` | Web3 | Web3 instance |
`wallet?` | [ReadOnlyWallet](../interfaces/_contractkit_src_wallets_wallet_.readonlywallet.md) | - |

**Returns:** *[ContractKit](../classes/_contractkit_src_kit_.contractkit.md)‹›*
