# WalletBase

## Hierarchy

* **WalletBase**

  ↳ [LocalWallet]()

  ↳ [RemoteWallet]()

## Implements

* [Wallet]()

## Index

### Methods

* [getAccounts]()
* [hasAccount]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Methods

### getAccounts

▸ **getAccounts**\(\): [_Address_](_base_.md#address)_\[\]_

_Defined in_ [_contractkit/src/wallets/wallet.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L29)

Gets a list of accounts that have been registered

**Returns:** [_Address_](_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](_base_.md#address)\): _boolean_

_Defined in_ [_contractkit/src/wallets/wallet.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L37)

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](_base_.md#address) | Account to check |

**Returns:** _boolean_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](_base_.md#address), `data`: string\): _Promise‹string›_

_Defined in_ [_contractkit/src/wallets/wallet.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L81)

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Defined in_ [_contractkit/src/wallets/wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](_base_.md#address), `typedData`: [EIP712TypedData]()\): _Promise‹string›_

_Defined in_ [_contractkit/src/wallets/wallet.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L98)

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](_base_.md#address) | Address of the account to sign with |
| `typedData` | [EIP712TypedData]() | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

