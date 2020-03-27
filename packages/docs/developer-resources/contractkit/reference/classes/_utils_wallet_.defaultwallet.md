# Class: DefaultWallet

## Hierarchy

* **DefaultWallet**

## Implements

* [Wallet](../interfaces/_utils_wallet_.wallet.md)

## Index

### Methods

* [addAccount](_utils_wallet_.defaultwallet.md#addaccount)
* [getAccounts](_utils_wallet_.defaultwallet.md#getaccounts)
* [hasAccount](_utils_wallet_.defaultwallet.md#hasaccount)
* [signPersonalMessage](_utils_wallet_.defaultwallet.md#signpersonalmessage)
* [signTransaction](_utils_wallet_.defaultwallet.md#signtransaction)
* [signTypedData](_utils_wallet_.defaultwallet.md#signtypeddata)

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/utils/wallet.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *void*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Defined in [contractkit/src/utils/wallet.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L36)*

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: undefined | string): *boolean*

*Defined in [contractkit/src/utils/wallet.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | undefined &#124; string |

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: string, `data`: string): *Promise‹string›*

*Defined in [contractkit/src/utils/wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L61)*

Sign a personal Ethereum signed message.
The address must be provided it must match the address calculated from the private key.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | string | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/wallet.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

*Defined in [contractkit/src/utils/wallet.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L86)*

Sign an EIP712 Typed Data message. The signing address will be calculated from the private key.
The address must be provided it must match the address calculated from the private key.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | - |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
