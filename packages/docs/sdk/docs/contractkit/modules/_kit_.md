[@celo/contractkit](../README.md) › ["kit"](_kit_.md)

# Module: "kit"

## Index

### Classes

* [ContractKit](../classes/_kit_.contractkit.md)

### Interfaces

* [NetworkConfig](../interfaces/_kit_.networkconfig.md)

### Type aliases

* [HttpProviderOptions](_kit_.md#httpprovideroptions)

### Variables

* [API_KEY_HEADER_KEY](_kit_.md#const-api_key_header_key)

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)
* [newKitWithApiKey](_kit_.md#newkitwithapikey)

## Type aliases

###  HttpProviderOptions

Ƭ **HttpProviderOptions**: *HttpProviderOptions*

*Defined in [packages/sdk/contractkit/src/kit.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L35)*

## Variables

### `Const` API_KEY_HEADER_KEY

• **API_KEY_HEADER_KEY**: *"apiKey"* = "apiKey"

*Defined in [packages/sdk/contractkit/src/kit.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L36)*

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: ReadOnlyWallet, `options?`: [HttpProviderOptions](_kit_.md#httpprovideroptions)): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L44)*

Creates a new instance of `ContractKit` given a nodeUrl

**`optional`** wallet to reuse or add a wallet different than the default (example ledger-wallet)

**`optional`** options to pass to the Web3 HttpProvider constructor

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`wallet?` | ReadOnlyWallet | - |
`options?` | [HttpProviderOptions](_kit_.md#httpprovideroptions) | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*

___

###  newKitFromWeb3

▸ **newKitFromWeb3**(`web3`: Web3, `wallet`: ReadOnlyWallet): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L76)*

Creates a new instance of the `ContractKit` with a web3 instance

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`web3` | Web3 | - | Web3 instance  |
`wallet` | ReadOnlyWallet | new LocalWallet() | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*

___

###  newKitWithApiKey

▸ **newKitWithApiKey**(`url`: string, `apiKey`: string, `wallet?`: ReadOnlyWallet): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L62)*

Creates a new instance of `ContractKit` given a nodeUrl and apiKey

**`optional`** wallet to reuse or add a wallet different than the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`apiKey` | string | to include in the http request header |
`wallet?` | ReadOnlyWallet | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*
