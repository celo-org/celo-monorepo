# Class: LocalWallet

## Hierarchy

* [WalletBase](_wallets_wallet_.walletbase.md)‹[LocalSigner](_wallets_signers_local_signer_.localsigner.md)›

  ↳ **LocalWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Methods

* [addAccount](_wallets_local_wallet_.localwallet.md#addaccount)
* [decrypt](_wallets_local_wallet_.localwallet.md#decrypt)
* [getAccounts](_wallets_local_wallet_.localwallet.md#getaccounts)
* [hasAccount](_wallets_local_wallet_.localwallet.md#hasaccount)
* [signPersonalMessage](_wallets_local_wallet_.localwallet.md#signpersonalmessage)
* [signTransaction](_wallets_local_wallet_.localwallet.md#signtransaction)
* [signTypedData](_wallets_local_wallet_.localwallet.md#signtypeddata)

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/wallets/local-wallet.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L11)*

Register the private key as signer account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privateKey` | string | account private key  |

**Returns:** *void*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[decrypt](_wallets_wallet_.walletbase.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/wallet.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L42)*

Gets a list of accounts that have been registered

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/wallet.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L50)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/wallet.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L94)*

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

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[signTransaction](_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/wallet.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L73)*

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/wallet.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L111)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
