# Class: LocalWallet

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

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [wallet-local/src/local-wallet.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-wallet.ts#L10)*

Register the private key as signer account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privateKey` | string | account private key  |

**Returns:** *void*

___

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[computeSharedSecret](_local_wallet_.localwallet.md#computesharedsecret)*

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret (an ECDH key exchange object) between two accounts

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer›*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[decrypt](_local_wallet_.localwallet.md#decrypt)*

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer›*

___

###  getAccounts

▸ **getAccounts**(): *Address[]*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[getAccounts](_local_wallet_.localwallet.md#getaccounts)*

Defined in wallet-base/lib/wallet-base.d.ts:18

Gets a list of accounts that have been registered

**Returns:** *Address[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[hasAccount](_local_wallet_.localwallet.md#hasaccount)*

Defined in wallet-base/lib/wallet-base.d.ts:28

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  removeAccount

▸ **removeAccount**(`address`: Address): *void*

*Overrides void*

*Defined in [wallet-local/src/local-wallet.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-local/src/local-wallet.ts#L24)*

Remove the account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Adddress of the account to remove  |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[signPersonalMessage](_local_wallet_.localwallet.md#signpersonalmessage)*

Defined in wallet-base/lib/wallet-base.d.ts:51

Sign a personal Ethereum signed message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: CeloTx): *Promise‹EncodedTransaction›*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[signTransaction](_local_wallet_.localwallet.md#signtransaction)*

Defined in wallet-base/lib/wallet-base.d.ts:44

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | CeloTx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [LocalWallet](_local_wallet_.localwallet.md).[signTypedData](_local_wallet_.localwallet.md#signtypeddata)*

Defined in wallet-base/lib/wallet-base.d.ts:58

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
