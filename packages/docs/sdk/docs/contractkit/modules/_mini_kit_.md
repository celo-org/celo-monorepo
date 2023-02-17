[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["mini-kit"](_mini_kit_.md)

# Module: "mini-kit"

## Index

### Classes

* [MiniContractKit](../classes/_mini_kit_.minicontractkit.md)

### Variables

* [ContractKit](_mini_kit_.md#const-contractkit)

### Functions

* [newKit](_mini_kit_.md#newkit)
* [newKitFromWeb3](_mini_kit_.md#newkitfromweb3)
* [newKitWithApiKey](_mini_kit_.md#newkitwithapikey)

## Variables

### `Const` ContractKit

• **ContractKit**: *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)* = MiniContractKit

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L82)*

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: ReadOnlyWallet, `options?`: [HttpProviderOptions](_setupforkits_.md#httpprovideroptions)): *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L21)*

Creates a new instance of `MiniMiniContractKit` given a nodeUrl

**`optional`** wallet to reuse or add a wallet different than the default (example ledger-wallet)

**`optional`** options to pass to the Web3 HttpProvider constructor

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`wallet?` | ReadOnlyWallet | - |
`options?` | [HttpProviderOptions](_setupforkits_.md#httpprovideroptions) | - |

**Returns:** *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3, `wallet`: ReadOnlyWallet): *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L41)*

Creates a new instance of the `MiniContractKit` with a web3 instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`web3` | Web3 | - | Web3 instance  |
`wallet` | ReadOnlyWallet | new LocalWallet() | - |

**Returns:** *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*

___

###  newKitWithApiKey

▸ **newKitWithApiKey**(`url`: string, `apiKey`: string, `wallet?`: ReadOnlyWallet): *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/mini-kit.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/mini-kit.ts#L32)*

Creates a new instance of `MiniContractKit` given a nodeUrl and apiKey

**`optional`** wallet to reuse or add a wallet different than the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`apiKey` | string | to include in the http request header |
`wallet?` | ReadOnlyWallet | - |

**Returns:** *[MiniContractKit](../classes/_mini_kit_.minicontractkit.md)‹›*
