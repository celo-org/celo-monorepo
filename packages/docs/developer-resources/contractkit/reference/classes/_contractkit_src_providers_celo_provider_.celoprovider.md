# Class: CeloProvider

## Hierarchy

* **CeloProvider**

## Index

### Constructors

* [constructor](_contractkit_src_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](_contractkit_src_providers_celo_provider_.celoprovider.md#existingprovider)
* [wallet](_contractkit_src_providers_celo_provider_.celoprovider.md#wallet)

### Accessors

* [connected](_contractkit_src_providers_celo_provider_.celoprovider.md#connected)

### Methods

* [addAccount](_contractkit_src_providers_celo_provider_.celoprovider.md#addaccount)
* [getAccounts](_contractkit_src_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_contractkit_src_providers_celo_provider_.celoprovider.md#islocalaccount)
* [send](_contractkit_src_providers_celo_provider_.celoprovider.md#send)
* [stop](_contractkit_src_providers_celo_provider_.celoprovider.md#stop)
* [supportsSubscriptions](_contractkit_src_providers_celo_provider_.celoprovider.md#supportssubscriptions)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: provider, `wallet`: [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)): *[CeloProvider](_contractkit_src_providers_celo_provider_.celoprovider.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`existingProvider` | provider | - |
`wallet` | [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md) | new LocalWallet() |

**Returns:** *[CeloProvider](_contractkit_src_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *provider*

*Defined in [contractkit/src/providers/celo-provider.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L29)*

___

###  wallet

• **wallet**: *[Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

## Accessors

###  connected

• **get connected**(): *any*

*Defined in [contractkit/src/providers/celo-provider.ts:229](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L229)*

**Returns:** *any*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [contractkit/src/providers/celo-provider.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L45)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/providers/celo-provider.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  send

▸ **send**(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L58)*

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

*Defined in [contractkit/src/providers/celo-provider.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L136)*

**Returns:** *void*

___

###  supportsSubscriptions

▸ **supportsSubscriptions**(): *any*

*Defined in [contractkit/src/providers/celo-provider.ts:233](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L233)*

**Returns:** *any*
