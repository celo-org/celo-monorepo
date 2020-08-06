# Class: LocalWallet

## Hierarchy

* [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md)

  ↳ **LocalWallet**

## Implements

* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)

## Index

### Methods

* [addAccount](_contractkit_src_wallets_local_wallet_.localwallet.md#addaccount)
* [decrypt](_contractkit_src_wallets_local_wallet_.localwallet.md#decrypt)
* [getAccounts](_contractkit_src_wallets_local_wallet_.localwallet.md#getaccounts)
* [hasAccount](_contractkit_src_wallets_local_wallet_.localwallet.md#hasaccount)
* [signPersonalMessage](_contractkit_src_wallets_local_wallet_.localwallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_local_wallet_.localwallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_local_wallet_.localwallet.md#signtypeddata)

## Methods

###  addAccount

▸ **addAccount**(`privateKey`: string): *void*

*Defined in [contractkit/src/wallets/local-wallet.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/local-wallet.ts#L10)*

Register the private key as signer account

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`privateKey` | string | account private key  |

**Returns:** *void*

___

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[decrypt](_contractkit_src_wallets_wallet_.walletbase.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_contractkit_src_base_.md#address)[]*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[getAccounts](_contractkit_src_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/wallet.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L30)*

Gets a list of accounts that have been registered

**Returns:** *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[hasAccount](_contractkit_src_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/wallet.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L38)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signPersonalMessage](_contractkit_src_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/wallet.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L82)*

Sign a personal Ethereum signed message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account to sign with |
`data` | string | Hex string message to sign |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)

___

###  signTransaction

▸ **signTransaction**(`txParams`: Tx): *Promise‹EncodedTransaction›*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signTransaction](_contractkit_src_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L61)*

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signTypedData](_contractkit_src_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L99)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
