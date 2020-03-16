# Interface: Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [DefaultWallet](../classes/_utils_wallet_.defaultwallet.md)

## Index

### Properties

* [addAccount](_utils_wallet_.wallet.md#addaccount)
* [getAccounts](_utils_wallet_.wallet.md#getaccounts)
* [hasAccount](_utils_wallet_.wallet.md#hasaccount)
* [signPersonalMessage](_utils_wallet_.wallet.md#signpersonalmessage)
* [signTransaction](_utils_wallet_.wallet.md#signtransaction)
* [signTypedData](_utils_wallet_.wallet.md#signtypeddata)

## Properties

###  addAccount

• **addAccount**: *function*

*Defined in [contractkit/src/utils/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L14)*

#### Type declaration:

▸ (`privateKey`: string): *void*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

___

###  getAccounts

• **getAccounts**: *function*

*Defined in [contractkit/src/utils/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L15)*

#### Type declaration:

▸ (): *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [contractkit/src/utils/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L16)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [contractkit/src/utils/wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L19)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [contractkit/src/utils/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L17)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [contractkit/src/utils/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/wallet.ts#L18)*

#### Type declaration:

▸ (`address`: string, `typedData`: [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`typedData` | [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md) |
