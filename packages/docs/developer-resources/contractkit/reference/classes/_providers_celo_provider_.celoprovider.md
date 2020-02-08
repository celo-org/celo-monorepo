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
* [on](_providers_celo_provider_.celoprovider.md#on)
* [privateKey](_providers_celo_provider_.celoprovider.md#privatekey)

### Methods

* [addAccount](_providers_celo_provider_.celoprovider.md#addaccount)
* [send](_providers_celo_provider_.celoprovider.md#send)
* [sendAsync](_providers_celo_provider_.celoprovider.md#sendasync)
* [start](_providers_celo_provider_.celoprovider.md#start)
* [stop](_providers_celo_provider_.celoprovider.md#stop)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: Provider, `privateKey`: string): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`existingProvider` | Provider |
`privateKey` | string |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *Provider*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L17)*

___

###  on

• **on**: *null | OnFn* = null

*Defined in [packages/contractkit/src/providers/celo-provider.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L12)*

___

###  privateKey

• **privateKey**: *string*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L17)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

___

###  send

▸ **send**(`payload`: JSONRPCRequestPayload, `callback`: Callback‹JsonRPCResponse›): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L46)*

Send method as expected by web3.js

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JSONRPCRequestPayload |
`callback` | Callback‹JsonRPCResponse› |

**Returns:** *void*

___

###  sendAsync

▸ **sendAsync**(`payload`: JSONRPCRequestPayload, `callback`: Callback‹JsonRPCResponse›): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JSONRPCRequestPayload |
`callback` | Callback‹JsonRPCResponse› |

**Returns:** *void*

___

###  start

▸ **start**(`callback?`: undefined | function): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`callback?` | undefined &#124; function |

**Returns:** *void*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L59)*

**Returns:** *void*
