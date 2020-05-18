# Wallet

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

### getAccounts

• **getAccounts**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)

#### Type declaration:

▸ \(\): [_Address_](../external-modules/_base_.md#address)_\[\]_

### hasAccount

• **hasAccount**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)

#### Type declaration:

▸ \(`address?`: [Address](../external-modules/_base_.md#address)\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](../external-modules/_base_.md#address) |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)

#### Type declaration:

▸ \(`address`: [Address](../external-modules/_base_.md#address), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) |
| `data` | string |

### signTransaction

• **signTransaction**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L16)

#### Type declaration:

▸ \(`txParams`: Tx\): _Promise‹EncodedTransaction›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txParams` | Tx |

### signTypedData

• **signTypedData**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L17)

#### Type declaration:

▸ \(`address`: [Address](../external-modules/_base_.md#address), `typedData`: [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md)\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../external-modules/_base_.md#address) |
| `typedData` | [EIP712TypedData](_utils_sign_typed_data_utils_.eip712typeddata.md) |

