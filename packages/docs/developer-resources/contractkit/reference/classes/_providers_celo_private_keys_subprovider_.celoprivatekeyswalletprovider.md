# Class: CeloPrivateKeysWalletProvider

This class supports storing multiple private keys for signing.
The base class PrivateKeyWalletSubprovider only supports one key.

## Hierarchy

* PrivateKeyWalletSubprovider

  ↳ **CeloPrivateKeysWalletProvider**

## Index

### Constructors

* [constructor](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#constructor)

### Properties

* [privateKey](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#privatekey)

### Methods

* [addAccount](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#addaccount)
* [emitPayloadAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#emitpayloadasync)
* [getAccounts](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#getaccounts)
* [getAccountsAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#getaccountsasync)
* [handleRequest](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#handlerequest)
* [setEngine](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#setengine)
* [signPersonalMessageAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#signpersonalmessageasync)
* [signTransactionAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#signtransactionasync)
* [signTypedDataAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#signtypeddataasync)

## Constructors

###  constructor

\+ **new CeloPrivateKeysWalletProvider**(`privateKey`: string): *[CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md)*

*Overrides void*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *[CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md)*

## Properties

###  privateKey

• **privateKey**: *string*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L51)*

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  emitPayloadAsync

▸ **emitPayloadAsync**(`payload`: Partial‹JSONRPCRequestPayloadWithMethod›): *Promise‹JSONRPCResponsePayload›*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[emitPayloadAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#emitpayloadasync)*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/subprovider.d.ts:25

Emits a JSON RPC payload that will then be handled by the ProviderEngine instance
this subprovider is a part of. The payload will cascade down the subprovider middleware
stack until finding the responsible entity for handling the request.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`payload` | Partial‹JSONRPCRequestPayloadWithMethod› | JSON RPC payload |

**Returns:** *Promise‹JSONRPCResponsePayload›*

JSON RPC response payload

___

###  getAccounts

▸ **getAccounts**(): *string[]*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L68)*

**Returns:** *string[]*

___

###  getAccountsAsync

▸ **getAccountsAsync**(): *Promise‹string[]›*

*Overrides void*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L73)*

**Returns:** *Promise‹string[]›*

___

###  handleRequest

▸ **handleRequest**(`payload`: JSONRPCRequestPayload, `next`: Callback, `end`: ErrorCallback): *Promise‹void›*

*Overrides void*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`payload` | JSONRPCRequestPayload |
`next` | Callback |
`end` | ErrorCallback |

**Returns:** *Promise‹void›*

___

###  setEngine

▸ **setEngine**(`engine`: Web3ProviderEngine): *void*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[setEngine](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#setengine)*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/subprovider.d.ts:32

Set's the subprovider's engine to the ProviderEngine it is added to.
This is only called within the ProviderEngine source code, do not call
directly.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`engine` | Web3ProviderEngine | The ProviderEngine this subprovider is added to  |

**Returns:** *void*

___

###  signPersonalMessageAsync

▸ **signPersonalMessageAsync**(`data`: string, `address`: string): *Promise‹string›*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[signPersonalMessageAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#signpersonalmessageasync)*

*Overrides void*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/private_key_wallet.d.ts:44

Sign a personal Ethereum signed message. The signing address will be calculated from the private key.
The address must be provided it must match the address calculated from the private key.
If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
or `personal_sign` JSON RPC request, and this method will be called auto-magically.
If you are not using this via a ProviderEngine instance, you can call it directly.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`data` | string | Hex string message to sign |
`address` | string | Address of the account to sign with |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransactionAsync

▸ **signTransactionAsync**(`txParamsInput`: [CeloPartialTxParams](../interfaces/_utils_tx_signing_.celopartialtxparams.md)): *Promise‹string›*

*Overrides void*

*Defined in [packages/contractkit/src/providers/celo-private-keys-subprovider.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/providers/celo-private-keys-subprovider.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`txParamsInput` | [CeloPartialTxParams](../interfaces/_utils_tx_signing_.celopartialtxparams.md) |

**Returns:** *Promise‹string›*

___

###  signTypedDataAsync

▸ **signTypedDataAsync**(`address`: string, `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [CeloPrivateKeysWalletProvider](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md).[signTypedDataAsync](_providers_celo_private_keys_subprovider_.celoprivatekeyswalletprovider.md#signtypeddataasync)*

*Overrides void*

Defined in node_modules/@0x/subproviders/lib/src/subproviders/private_key_wallet.d.ts:55

Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
The address must be provided it must match the address calculated from the private key.
If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
JSON RPC request, and this method will be called auto-magically.
If you are not using this via a ProviderEngine instance, you can call it directly.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of the account to sign with |
`typedData` | EIP712TypedData | - |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
