# Class: WalletBase

## Hierarchy

* **WalletBase**

  ↳ [LocalWallet](_wallets_local_wallet_.localwallet.md)

  ↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Methods

* [getAccounts](_wallets_wallet_.walletbase.md#getaccounts)
* [hasAccount](_wallets_wallet_.walletbase.md#hasaccount)
* [signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)
* [signTransaction](_wallets_wallet_.walletbase.md#signtransaction)
* [signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)

## Methods

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Defined in [contractkit/src/wallets/wallet.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L29)*

Gets a list of accounts that have been registered

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Defined in [contractkit/src/wallets/wallet.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L37)*

Returns true if account has been registered

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Defined in [contractkit/src/wallets/wallet.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L81)*

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

*Defined in [contractkit/src/wallets/wallet.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L60)*

Gets the signer based on the 'from' field in the tx body

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | Transaction to sign  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md)): *Promise‹string›*

*Defined in [contractkit/src/wallets/wallet.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L98)*

Sign an EIP712 Typed Data message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
