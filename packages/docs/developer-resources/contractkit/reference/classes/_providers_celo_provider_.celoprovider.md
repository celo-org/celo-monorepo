# Class: CeloProvider

## Hierarchy

* **CeloProvider**

## Implements

* Provider

## Index

### Constructors

* [constructor](_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](_providers_celo_provider_.celoprovider.md#existingprovider)

### Methods

* [addAccount](_providers_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_providers_celo_provider_.celoprovider.md#islocalaccount)
* [send](_providers_celo_provider_.celoprovider.md#send)
* [stop](_providers_celo_provider_.celoprovider.md#stop)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: Provider): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`existingProvider` | Provider |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *Provider*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [contractkit/src/providers/celo-provider.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L37)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/providers/celo-provider.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  send

▸ **send**(`payload`: JsonRPCRequest, `callback`: Callback‹JsonRPCResponse›): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L50)*

Send method as expected by web3.js

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JsonRPCRequest |
`callback` | Callback‹JsonRPCResponse› |

**Returns:** *void*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L128)*

**Returns:** *void*
