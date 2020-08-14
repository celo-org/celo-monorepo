# Class: RemoteWallet

Abstract class representing a remote wallet that requires async initialization

## Hierarchy

* [WalletBase](_wallets_wallet_.walletbase.md)

  ↳ **RemoteWallet**

  ↳ [AzureHSMWallet](_wallets_azure_hsm_wallet_.azurehsmwallet.md)

  ↳ [LedgerWallet](_wallets_ledger_wallet_.ledgerwallet.md)

  ↳ [RpcWallet](_wallets_rpc_wallet_.rpcwallet.md)

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Methods

* [decrypt](_wallets_remote_wallet_.remotewallet.md#decrypt)
* [getAccounts](_wallets_remote_wallet_.remotewallet.md#getaccounts)
* [hasAccount](_wallets_remote_wallet_.remotewallet.md#hasaccount)
* [init](_wallets_remote_wallet_.remotewallet.md#init)
* [isSetupFinished](_wallets_remote_wallet_.remotewallet.md#issetupfinished)
* [signPersonalMessage](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)
* [signTransaction](_wallets_remote_wallet_.remotewallet.md#signtransaction)
* [signTypedData](_wallets_remote_wallet_.remotewallet.md#signtypeddata)

## Methods

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[decrypt](_wallets_wallet_.walletbase.md#decrypt)*

*Defined in [contractkit/src/wallets/wallet.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Defined in [contractkit/src/wallets/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isSetupFinished

▸ **isSetupFinished**(): *boolean*

*Defined in [contractkit/src/wallets/remote-wallet.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L110)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)*

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

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTransaction](_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)*

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
