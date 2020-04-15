# Interface: Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_wallets_ledger_wallet_.ledgerwallet.md)
* [LocalWallet](../classes/_wallets_local_wallet_.localwallet.md)
* [LocalWallet](../classes/_wallets_local_wallet_.localwallet.md)
* [RemoteWallet](../classes/_wallets_remote_wallet_.remotewallet.md)
* [RemoteWallet](../classes/_wallets_remote_wallet_.remotewallet.md)
* [WalletBase](../classes/_wallets_wallet_.walletbase.md)

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

*Defined in [contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

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

*Defined in [contractkit/src/wallets/wallet.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)*

#### Type declaration:

▸ (`txParams`: Tx): *Promise‹EncodedTransaction›*

**Parameters:**

Name | Type |
------ | ------ |
`txParams` | Tx |

___

###  signTypedData

• **signTypedData**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)*

#### Type declaration:

▸ (`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`typedData` | [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md) |
