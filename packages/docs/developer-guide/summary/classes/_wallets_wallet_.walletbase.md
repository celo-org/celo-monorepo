# WalletBase

## Type parameters

▪ **TSigner**: [_Signer_](../interfaces/_wallets_signers_signer_.signer.md)

## Hierarchy

* **WalletBase**

  ↳ [LocalWallet](_wallets_local_wallet_.localwallet.md)

  ↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)

## Index

### Methods

* [computeSharedSecret](_wallets_wallet_.walletbase.md#computesharedsecret)
* [decrypt](_wallets_wallet_.walletbase.md#decrypt)
* [getAccounts](_wallets_wallet_.walletbase.md#getaccounts)
* [hasAccount](_wallets_wallet_.walletbase.md#hasaccount)
* [removeAccount](_wallets_wallet_.walletbase.md#removeaccount)
* [signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.walletbase.md#signtransaction)
* [signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: [Address](../modules/_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getAccounts

▸ **getAccounts**\(\): [_Address_](../modules/_base_.md#address)_\[\]_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L44)

Gets a list of accounts that have been registered

**Returns:** [_Address_](../modules/_base_.md#address)_\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L52)

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:113_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L113)

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L92)

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:130_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L130)

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

