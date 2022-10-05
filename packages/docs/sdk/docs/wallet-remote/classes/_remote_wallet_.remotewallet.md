[@celo/wallet-remote](../README.md) › ["remote-wallet"](../modules/_remote_wallet_.md) › [RemoteWallet](_remote_wallet_.remotewallet.md)

# Class: RemoteWallet <**TSigner**>

Abstract class representing a remote wallet that requires async initialization

## Type parameters

▪ **TSigner**: *Signer*

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

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [RemoteWallet](_remote_wallet_.remotewallet.md).[computeSharedSecret](_remote_wallet_.remotewallet.md#computesharedsecret)*

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

*Inherited from [RemoteWallet](_remote_wallet_.remotewallet.md).[decrypt](_remote_wallet_.remotewallet.md#decrypt)*

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

*Overrides void*

*Defined in [wallet-remote/src/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Overrides void*

*Defined in [wallet-remote/src/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Defined in [wallet-remote/src/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isSetupFinished

▸ **isSetupFinished**(): *boolean*

*Defined in [wallet-remote/src/remote-wallet.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L110)*

**Returns:** *boolean*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [RemoteWallet](_remote_wallet_.remotewallet.md).[removeAccount](_remote_wallet_.remotewallet.md#removeaccount)*

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Overrides void*

*Defined in [wallet-remote/src/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L89)*

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

*Overrides void*

*Defined in [wallet-remote/src/remote-wallet.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L79)*

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | CeloTx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Overrides void*

*Defined in [wallet-remote/src/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-remote/src/remote-wallet.ts#L99)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
