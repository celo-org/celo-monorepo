# Class: CeloProvider

## Hierarchy

* **CeloProvider**

## Index

### Constructors

* [constructor](_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](_providers_celo_provider_.celoprovider.md#existingprovider)
* [wallet](_providers_celo_provider_.celoprovider.md#wallet)

### Methods

* [addAccount](_providers_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_providers_celo_provider_.celoprovider.md#islocalaccount)
* [on](_providers_celo_provider_.celoprovider.md#on)
* [once](_providers_celo_provider_.celoprovider.md#once)
* [removeAllListeners](_providers_celo_provider_.celoprovider.md#removealllisteners)
* [removeListener](_providers_celo_provider_.celoprovider.md#removelistener)
* [send](_providers_celo_provider_.celoprovider.md#send)
* [stop](_providers_celo_provider_.celoprovider.md#stop)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: provider, `wallet`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`existingProvider` | provider | - |
`wallet` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) | new DefaultWallet() |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *provider*

*Defined in [contractkit/src/providers/celo-provider.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L29)*

___

###  wallet

• **wallet**: *[Wallet](../interfaces/_wallets_wallet_.wallet.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [contractkit/src/providers/celo-provider.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L43)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/providers/celo-provider.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  on

▸ **on**(`type`: string, `callback`: function): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L134)*

**Parameters:**

▪ **type**: *string*

▪ **callback**: *function*

▸ (): *void*

**Returns:** *void*

___

###  once

▸ **once**(`type`: string, `callback`: function): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:142](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L142)*

**Parameters:**

▪ **type**: *string*

▪ **callback**: *function*

▸ (): *void*

**Returns:** *void*

___

###  removeAllListeners

▸ **removeAllListeners**(`type`: string): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | string |

**Returns:** *void*

___

###  removeListener

▸ **removeListener**(`type`: string, `callback`: function): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:153](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L153)*

**Parameters:**

▪ **type**: *string*

▪ **callback**: *function*

▸ (): *void*

**Returns:** *void*

___

###  send

▸ **send**(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L56)*

Send method as expected by web3.js

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JsonRpcPayload |
`callback` | Callback‹JsonRpcResponse› |

**Returns:** *void*

___

###  stop

▸ **stop**(): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L175)*

**Returns:** *void*
