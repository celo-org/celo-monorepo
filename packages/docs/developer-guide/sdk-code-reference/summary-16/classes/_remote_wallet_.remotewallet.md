# RemoteWallet

Abstract class representing a remote wallet that requires async initialization

## Type parameters

▪ **TSigner**: _Signer_

## Hierarchy

* WalletBase‹TSigner›

  ↳ **RemoteWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Methods

* [computeSharedSecret](_remote_wallet_.remotewallet.md#computesharedsecret)
* [decrypt](_remote_wallet_.remotewallet.md#decrypt)
* [getAccounts](_remote_wallet_.remotewallet.md#getaccounts)
* [hasAccount](_remote_wallet_.remotewallet.md#hasaccount)
* [init](_remote_wallet_.remotewallet.md#init)
* [isSetupFinished](_remote_wallet_.remotewallet.md#issetupfinished)
* [removeAccount](_remote_wallet_.remotewallet.md#removeaccount)
* [signPersonalMessage](_remote_wallet_.remotewallet.md#signpersonalmessage)
* [signTransaction](_remote_wallet_.remotewallet.md#signtransaction)
* [signTypedData](_remote_wallet_.remotewallet.md#signtypeddata)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_RemoteWallet_](_remote_wallet_.remotewallet.md)_._[_computeSharedSecret_](_remote_wallet_.remotewallet.md#computesharedsecret)

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer›_

_Inherited from_ [_RemoteWallet_](_remote_wallet_.remotewallet.md)_._[_decrypt_](_remote_wallet_.remotewallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Overrides void_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L60)

Get a list of accounts in the remote wallet

**Returns:** _Address\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Overrides void_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L69)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | Address | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L19)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### isSetupFinished

▸ **isSetupFinished**\(\): _boolean_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L109)

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_RemoteWallet_](_remote_wallet_.remotewallet.md)_._[_removeAccount_](_remote_wallet_.remotewallet.md#removeaccount)

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Overrides void_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L88)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: CeloTx\): _Promise‹EncodedTransaction›_

_Overrides void_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L78)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | CeloTx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

_Overrides void_

_Defined in_ [_wallet-remote/src/remote-wallet.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L98)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

