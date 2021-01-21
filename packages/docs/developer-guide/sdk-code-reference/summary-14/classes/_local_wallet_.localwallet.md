# LocalWallet

## Hierarchy

* WalletBase‹[LocalSigner](_local_signer_.localsigner.md)›

  ↳ **LocalWallet**

## Implements

* ReadOnlyWallet
* Wallet

## Index

### Methods

* [addAccount](_local_wallet_.localwallet.md#addaccount)
* [computeSharedSecret](_local_wallet_.localwallet.md#computesharedsecret)
* [decrypt](_local_wallet_.localwallet.md#decrypt)
* [getAccounts](_local_wallet_.localwallet.md#getaccounts)
* [hasAccount](_local_wallet_.localwallet.md#hasaccount)
* [removeAccount](_local_wallet_.localwallet.md#removeaccount)
* [signPersonalMessage](_local_wallet_.localwallet.md#signpersonalmessage)
* [signTransaction](_local_wallet_.localwallet.md#signtransaction)
* [signTypedData](_local_wallet_.localwallet.md#signtypeddata)

## Methods

### addAccount

▸ **addAccount**\(`privateKey`: string\): _void_

_Defined in_ [_wallet-local/src/local-wallet.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-wallet.ts#L10)

Register the private key as signer account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `privateKey` | string | account private key |

**Returns:** _void_

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_computeSharedSecret_](_local_wallet_.localwallet.md#computesharedsecret)

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

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_decrypt_](_local_wallet_.localwallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_getAccounts_](_local_wallet_.localwallet.md#getaccounts)

Defined in wallet-base/lib/wallet-base.d.ts:18

Gets a list of accounts that have been registered

**Returns:** _Address\[\]_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_hasAccount_](_local_wallet_.localwallet.md#hasaccount)

Defined in wallet-base/lib/wallet-base.d.ts:28

Returns true if account has been registered

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | Address | Account to check |

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`address`: Address\): _void_

_Overrides void_

_Defined in_ [_wallet-local/src/local-wallet.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-wallet.ts#L24)

Remove the account

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Adddress of the account to remove |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_signPersonalMessage_](_local_wallet_.localwallet.md#signpersonalmessage)

Defined in wallet-base/lib/wallet-base.d.ts:51

Sign a personal Ethereum signed message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: CeloTx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_signTransaction_](_local_wallet_.localwallet.md#signtransaction)

Defined in wallet-base/lib/wallet-base.d.ts:44

Gets the signer based on the 'from' field in the tx body

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | CeloTx | Transaction to sign |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_LocalWallet_](_local_wallet_.localwallet.md)_._[_signTypedData_](_local_wallet_.localwallet.md#signtypeddata)

Defined in wallet-base/lib/wallet-base.d.ts:58

Sign an EIP712 Typed Data message.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

