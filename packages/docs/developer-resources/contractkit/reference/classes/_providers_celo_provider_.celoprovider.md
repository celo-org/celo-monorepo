# Class: CeloProvider

## Hierarchy

* **CeloProvider**

## Index

### Constructors

* [constructor](_providers_celo_provider_.celoprovider.md#constructor)

### Properties

* [existingProvider](_providers_celo_provider_.celoprovider.md#existingprovider)
* [on](_providers_celo_provider_.celoprovider.md#optional-on)
* [wallet](_providers_celo_provider_.celoprovider.md#wallet)

### Methods

* [addAccount](_providers_celo_provider_.celoprovider.md#addaccount)
* [enableSubscriptions](_providers_celo_provider_.celoprovider.md#enablesubscriptions)
* [getAccounts](_providers_celo_provider_.celoprovider.md#getaccounts)
* [isLocalAccount](_providers_celo_provider_.celoprovider.md#islocalaccount)
* [send](_providers_celo_provider_.celoprovider.md#send)
* [stop](_providers_celo_provider_.celoprovider.md#stop)

## Constructors

###  constructor

\+ **new CeloProvider**(`existingProvider`: provider, `wallet`: [Wallet](../interfaces/_wallets_wallet_.wallet.md)): *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L28)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`existingProvider` | provider | - |
`wallet` | [Wallet](../interfaces/_wallets_wallet_.wallet.md) | new LocalWallet() |

**Returns:** *[CeloProvider](_providers_celo_provider_.celoprovider.md)*

## Properties

###  existingProvider

• **existingProvider**: *provider*

*Defined in [contractkit/src/providers/celo-provider.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L30)*

___

### `Optional` on

• **on**? : *undefined | function*

*Defined in [contractkit/src/providers/celo-provider.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L28)*

___

###  wallet

• **wallet**: *[Wallet](../interfaces/_wallets_wallet_.wallet.md)*

*Defined in [contractkit/src/providers/celo-provider.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L27)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  enableSubscriptions

▸ **enableSubscriptions**(): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:147](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L147)*

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *Promise‹string[]›*

*Defined in [contractkit/src/providers/celo-provider.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L44)*

**Returns:** *Promise‹string[]›*

___

###  isLocalAccount

▸ **isLocalAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/providers/celo-provider.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  send

▸ **send**(`payload`: JsonRpcPayload, `callback`: Callback‹JsonRpcResponse›): *void*

*Defined in [contractkit/src/providers/celo-provider.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L57)*

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

*Defined in [contractkit/src/providers/celo-provider.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-provider.ts#L135)*

**Returns:** *void*
