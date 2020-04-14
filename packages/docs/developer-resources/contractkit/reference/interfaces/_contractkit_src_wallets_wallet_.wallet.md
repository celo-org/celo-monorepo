# Interface: Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [DefaultWallet](../classes/_contractkit_src_wallets_default_wallet_.defaultwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)

## Index

### Properties

* [getAccounts](_contractkit_src_wallets_wallet_.wallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_wallet_.wallet.md#hasaccount)
* [signPersonalMessage](_contractkit_src_wallets_wallet_.wallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_wallet_.wallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_wallet_.wallet.md#signtypeddata)

## Properties

###  getAccounts

• **getAccounts**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L6)*

#### Type declaration:

▸ (): *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L7)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L10)*

#### Type declaration:

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `data`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`data` | string |

___

###  signTransaction

• **signTransaction**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L8)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L9)*

#### Type declaration:

▸ (`address`: string, `typedData`: [EIP712TypedData](_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`typedData` | [EIP712TypedData](_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md) |
