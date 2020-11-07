# Class: WalletBase <**TSigner**>

## Type parameters

▪ **TSigner**: *[Signer](../interfaces/_wallets_signers_signer_.signer.md)*

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

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: [Address](../modules/_base_.md#address), `publicKey`: string): *Promise‹Buffer›*

*Defined in [packages/contractkit/src/wallets/wallet.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)*

Computes the shared secret (an ECDH key exchange object) between two accounts

**Parameters:**

Name | Type |
------ | ------ |
`address` | [Address](../modules/_base_.md#address) |
`publicKey` | string |

**Returns:** *Promise‹Buffer›*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/wallet.ts:149](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L149)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Defined in [packages/contractkit/src/wallets/wallet.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L44)*

Gets a list of accounts that have been registered

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Defined in [packages/contractkit/src/wallets/wallet.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Defined in [packages/contractkit/src/wallets/wallet.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L52)*

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

Name | Type |
------ | ------ |
`_address` | string |

**Returns:** *void*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Defined in [packages/contractkit/src/wallets/wallet.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L113)*

Sign a personal Ethereum signed message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Defined in [packages/contractkit/src/wallets/wallet.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L92)*

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Defined in [packages/contractkit/src/wallets/wallet.ts:130](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L130)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
