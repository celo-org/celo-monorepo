[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["kit"](_kit_.md)

# Module: "kit"

## Index

### References

* [API_KEY_HEADER_KEY](_kit_.md#api_key_header_key)
* [HttpProviderOptions](_kit_.md#httpprovideroptions)

### Classes

* [ContractKit](../classes/_kit_.contractkit.md)

### Interfaces

* [NetworkConfig](../interfaces/_kit_.networkconfig.md)

### Functions

* [newKit](_kit_.md#newkit)
* [newKitFromWeb3](_kit_.md#newkitfromweb3)
* [newKitWithApiKey](_kit_.md#newkitwithapikey)

## References

###  API_KEY_HEADER_KEY

• **API_KEY_HEADER_KEY**:

___

###  HttpProviderOptions

• **HttpProviderOptions**:

## Functions

###  newKit

▸ **newKit**(`url`: string, `wallet?`: ReadOnlyWallet, `options?`: [HttpProviderOptions](_kit_.md#httpprovideroptions)): *[ContractKit](../classes/_kit_.contractkit.md)‹›*

*Defined in [packages/sdk/contractkit/src/kit.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L46)*

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

*Defined in [packages/sdk/contractkit/src/kit.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L66)*

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

*Defined in [packages/sdk/contractkit/src/kit.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/kit.ts#L57)*

Creates a new instance of `ContractKit` given a nodeUrl and apiKey

**`optional`** wallet to reuse or add a wallet different than the default (example ledger-wallet)

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`url` | string | CeloBlockchain node url |
`apiKey` | string | to include in the http request header |
`wallet?` | ReadOnlyWallet | - |

**Returns:** *[ContractKit](../classes/_kit_.contractkit.md)‹›*
