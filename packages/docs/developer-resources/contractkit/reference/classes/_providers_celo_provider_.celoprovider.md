# Class: CeloProvider

## Hierarchy

* **CeloProvider**

## Index

### Constructors

* [constructor](_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](_providers_celo_provider_.celoprovider.md#existingprovider)
* [nonceLock](_providers_celo_provider_.celoprovider.md#noncelock)
* [wallet](_providers_celo_provider_.celoprovider.md#wallet)

### Accessors

* [connected](_providers_celo_provider_.celoprovider.md#connected)

### Methods

* [addAccount](_providers_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_providers_celo_provider_.celoprovider.md#islocalaccount)
* [send](_providers_celo_provider_.celoprovider.md#send)
* [stop](_providers_celo_provider_.celoprovider.md#stop)
* [supportsSubscriptions](_providers_celo_provider_.celoprovider.md#supportssubscriptions)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: provider, `wallet`: [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L34)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`existingProvider` | provider | - |
`wallet` | [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md) | new LocalWallet() |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *provider*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L36)*

___

###  nonceLock

• **nonceLock**: *Lock*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L34)*

___

###  wallet

• **wallet**: *[ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L28)*

## Accessors

###  connected

• **get connected**(): *any*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L242)*

**Returns:** *any*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L45)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L53)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  send

▸ **send**(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L66)*

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

*Defined in [packages/contractkit/src/providers/celo-provider.ts:144](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L144)*

**Returns:** *void*

___

###  supportsSubscriptions

▸ **supportsSubscriptions**(): *any*

*Defined in [packages/contractkit/src/providers/celo-provider.ts:246](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L246)*

**Returns:** *any*
