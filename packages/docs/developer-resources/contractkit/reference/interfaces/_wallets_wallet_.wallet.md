# Interface: Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [DefaultWallet](../classes/_wallets_default_wallet_.defaultwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)

## Index

### Properties

* [getAccounts](_wallets_wallet_.wallet.md#getaccounts)
* [hasAccount](_wallets_wallet_.wallet.md#hasaccount)
* [signPersonalMessage](_wallets_wallet_.wallet.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.wallet.md#signtransaction)
* [signTypedData](_wallets_wallet_.wallet.md#signtypeddata)

## Properties

###  getAccounts

• **getAccounts**: *function*

*Defined in [src/wallets/wallet.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L6)*

#### Type declaration:

▸ (): *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [src/wallets/wallet.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L7)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [src/wallets/wallet.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L10)*

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

*Defined in [src/wallets/wallet.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L8)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [src/wallets/wallet.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L9)*

#### Type declaration:

▸ (`address`: string, `typedData`: [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`typedData` | [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md) |
