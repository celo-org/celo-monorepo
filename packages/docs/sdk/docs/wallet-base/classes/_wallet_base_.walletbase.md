[@celo/wallet-base](../README.md) › ["wallet-base"](../modules/_wallet_base_.md) › [WalletBase](_wallet_base_.walletbase.md)

# Class: WalletBase ‹**TSigner**›

## Type parameters

▪ **TSigner**: *Signer*

## Hierarchy

* **WalletBase**

## Implements

* ReadOnlyWallet

## Index

### Methods

* [computeSharedSecret](_wallet_base_.walletbase.md#computesharedsecret)
* [decrypt](_wallet_base_.walletbase.md#decrypt)
* [getAccounts](_wallet_base_.walletbase.md#getaccounts)
* [hasAccount](_wallet_base_.walletbase.md#hasaccount)
* [removeAccount](_wallet_base_.walletbase.md#removeaccount)
* [signPersonalMessage](_wallet_base_.walletbase.md#signpersonalmessage)
* [signTransaction](_wallet_base_.walletbase.md#signtransaction)
* [signTypedData](_wallet_base_.walletbase.md#signtypeddata)

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Defined in [wallets/wallet-base/src/wallet-base.ts:141](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L141)*

Computes the shared secret (an ECDH key exchange object) between two accounts

**Parameters:**

Name | Type |
------ | ------ |
`address` | Address |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallets/wallet-base/src/wallet-base.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *Address[]*

*Defined in [wallets/wallet-base/src/wallet-base.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L27)*

Gets a list of accounts that have been registered

**Returns:** *Address[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Defined in [wallets/wallet-base/src/wallet-base.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L43)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Defined in [wallets/wallet-base/src/wallet-base.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L35)*

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: Address, `data`: string): *Promise‹string›*

*Defined in [wallets/wallet-base/src/wallet-base.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L97)*

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

*Defined in [wallets/wallet-base/src/wallet-base.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L75)*

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | CeloTx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Defined in [wallets/wallet-base/src/wallet-base.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/wallet-base.ts#L114)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
