# Class: AzureHSMWallet

## Hierarchy

  ↳ [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md)

  ↳ **AzureHSMWallet**

## Implements

* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)
* [Wallet](../interfaces/_contractkit_src_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#constructor)

### Methods

* [getAccounts](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)
* [getAddressFromKeyName](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaddressfromkeyname)
* [hasAccount](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)
* [init](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#init)
* [isSetupFinished](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#issetupfinished)
* [signPersonalMessage](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)
* [signTypedData](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new AzureHSMWallet**(`vaultName`: string): *[AzureHSMWallet](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)*

*Defined in [contractkit/src/wallets/azure-hsm-wallet.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureHSMWallet](_contractkit_src_wallets_azure_hsm_wallet_.azurehsmwallet.md)*

## Methods

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_contractkit_src_base_.md#address)[]*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[getAccounts](_contractkit_src_wallets_remote_wallet_.remotewallet.md#getaccounts)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[getAccounts](_contractkit_src_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L61)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_contractkit_src_base_.md#address)[]*

___

###  getAddressFromKeyName

▸ **getAddressFromKeyName**(`keyName`: string): *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

*Defined in [contractkit/src/wallets/azure-hsm-wallet.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L49)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keyName` | string | Azure KeyVault key name  |

**Returns:** *Promise‹[Address](../modules/_contractkit_src_base_.md#address)›*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_contractkit_src_base_.md#address)): *boolean*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[hasAccount](_contractkit_src_wallets_remote_wallet_.remotewallet.md#hasaccount)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[hasAccount](_contractkit_src_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L70)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_contractkit_src_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[init](_contractkit_src_wallets_remote_wallet_.remotewallet.md#init)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L20)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isSetupFinished

▸ **isSetupFinished**(): *boolean*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[isSetupFinished](_contractkit_src_wallets_remote_wallet_.remotewallet.md#issetupfinished)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L110)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signPersonalMessage](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signPersonalMessage](_contractkit_src_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L89)*

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

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signTransaction](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signtransaction)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signTransaction](_contractkit_src_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L79)*

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_contractkit_src_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [RemoteWallet](_contractkit_src_wallets_remote_wallet_.remotewallet.md).[signTypedData](_contractkit_src_wallets_remote_wallet_.remotewallet.md#signtypeddata)*

*Overrides [WalletBase](_contractkit_src_wallets_wallet_.walletbase.md).[signTypedData](_contractkit_src_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [contractkit/src/wallets/remote-wallet.ts:99](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L99)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_contractkit_src_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
