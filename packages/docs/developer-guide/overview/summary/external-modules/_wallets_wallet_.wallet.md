# Wallet

## Hierarchy

* **Wallet**

## Implemented by

* [AzureHSMWallet]()
* [AzureHSMWallet]()
* [AzureHSMWallet]()
* [LedgerWallet]()
* [LedgerWallet]()
* [LedgerWallet]()
* [LocalWallet]()
* [LocalWallet]()
* [RemoteWallet]()
* [RemoteWallet]()
* [WalletBase]()

## Index

### Properties

* [getAccounts]()
* [hasAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Properties

### getAccounts

• **getAccounts**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L14)

#### Type declaration:

▸ \(\): [_Address_](_base_.md#address)_\[\]_

### hasAccount

• **hasAccount**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L15)

#### Type declaration:

▸ \(`address?`: [Address](_base_.md#address)\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address?` | [Address](_base_.md#address) |

### signPersonalMessage

• **signPersonalMessage**: _function_

_Defined in_ [_contractkit/src/wallets/wallet.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L18)

#### Type declaration:

▸ \(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
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

▸ \(`address`: [Address](_base_.md#address), `typedData`: [EIP712TypedData]()\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](_base_.md#address) |
| `typedData` | [EIP712TypedData]() |

