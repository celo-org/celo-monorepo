[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["setupForKits"](_setupforkits_.md)

# Module: "setupForKits"

## Index

### Type aliases

* [HttpProviderOptions](_setupforkits_.md#httpprovideroptions)

### Variables

* [API_KEY_HEADER_KEY](_setupforkits_.md#const-api_key_header_key)

### Functions

* [ensureCurrentProvider](_setupforkits_.md#ensurecurrentprovider)
* [getWeb3ForKit](_setupforkits_.md#getweb3forkit)
* [setupAPIKey](_setupforkits_.md#setupapikey)

## Type aliases

###  HttpProviderOptions

Ƭ **HttpProviderOptions**: *Web3HttpProviderOptions*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L3)*

## Variables

### `Const` API_KEY_HEADER_KEY

• **API_KEY_HEADER_KEY**: *"apiKey"* = "apiKey"

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L5)*

## Functions

###  ensureCurrentProvider

▸ **ensureCurrentProvider**(`web3`: Web3): *[ensureCurrentProvider](_setupforkits_.md#ensurecurrentprovider)*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L18)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |

**Returns:** *[ensureCurrentProvider](_setupforkits_.md#ensurecurrentprovider)*

___

###  getWeb3ForKit

▸ **getWeb3ForKit**(`url`: string, `options`: Web3HttpProviderOptions | undefined): *[getWeb3ForKit](_setupforkits_.md#getweb3forkit)*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L24)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |
`options` | Web3HttpProviderOptions &#124; undefined |

**Returns:** *[getWeb3ForKit](_setupforkits_.md#getweb3forkit)*

___

###  setupAPIKey

▸ **setupAPIKey**(`apiKey`: string): *[setupAPIKey](_setupforkits_.md#setupapikey)*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L8)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`apiKey` | string |

**Returns:** *[setupAPIKey](_setupforkits_.md#setupapikey)*
