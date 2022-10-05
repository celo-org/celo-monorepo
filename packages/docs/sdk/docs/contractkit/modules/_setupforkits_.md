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

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L4)*

## Variables

### `Const` API_KEY_HEADER_KEY

• **API_KEY_HEADER_KEY**: *"apiKey"* = "apiKey"

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L6)*

## Functions

###  ensureCurrentProvider

▸ **ensureCurrentProvider**(`web3`: Web3): *void*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L19)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |

**Returns:** *void*

___

###  getWeb3ForKit

▸ **getWeb3ForKit**(`url`: string, `options`: Web3HttpProviderOptions | undefined): *Web3‹›*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L25)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |
`options` | Web3HttpProviderOptions &#124; undefined |

**Returns:** *Web3‹›*

___

###  setupAPIKey

▸ **setupAPIKey**(`apiKey`: string): *HttpProviderOptions*

*Defined in [packages/sdk/contractkit/src/setupForKits.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/setupForKits.ts#L9)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`apiKey` | string |

**Returns:** *HttpProviderOptions*
