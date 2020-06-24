# Interface: Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [AzureHSMWallet](../classes/_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LedgerWallet](../classes/_contractkit_src_wallets_ledger_wallet_.ledgerwallet.md)
* [LocalWallet](../classes/_contractkit_src_wallets_local_wallet_.localwallet.md)
* [LocalWallet](../classes/_contractkit_src_wallets_local_wallet_.localwallet.md)
* [RemoteWallet](../classes/_contractkit_src_wallets_remote_wallet_.remotewallet.md)
* [RemoteWallet](../classes/_contractkit_src_wallets_remote_wallet_.remotewallet.md)
* [RpcWallet](../classes/_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)
* [RpcWallet](../classes/_contractkit_src_wallets_rpc_wallet_.rpcwallet.md)
* [WalletBase](../classes/_contractkit_src_wallets_wallet_.walletbase.md)

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

*Defined in [contractkit/src/wallets/wallet.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)*

#### Type declaration:

▸ (): *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

• **hasAccount**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)*

#### Type declaration:

▸ (`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) |

___

###  signPersonalMessage

• **signPersonalMessage**: *function*

*Defined in [contractkit/src/wallets/wallet.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)*

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

▸ (`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: [EIP712TypedData](_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) |
`typedData` | [EIP712TypedData](_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md) |
