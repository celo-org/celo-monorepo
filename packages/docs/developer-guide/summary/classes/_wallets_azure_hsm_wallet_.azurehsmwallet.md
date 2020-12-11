# AzureHSMWallet

## Hierarchy

↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)‹[AzureHSMSigner](_wallets_signers_azure_hsm_signer_.azurehsmsigner.md)›

↳ **AzureHSMWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)

## Index

### Constructors

* [constructor](_wallets_azure_hsm_wallet_.azurehsmwallet.md#constructor)

### Methods

* [computeSharedSecret](_wallets_azure_hsm_wallet_.azurehsmwallet.md#computesharedsecret)
* [decrypt](_wallets_azure_hsm_wallet_.azurehsmwallet.md#decrypt)
* [getAccounts](_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)
* [getAddressFromKeyName](_wallets_azure_hsm_wallet_.azurehsmwallet.md#getaddressfromkeyname)
* [hasAccount](_wallets_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)
* [init](_wallets_azure_hsm_wallet_.azurehsmwallet.md#init)
* [isSetupFinished](_wallets_azure_hsm_wallet_.azurehsmwallet.md#issetupfinished)
* [removeAccount](_wallets_azure_hsm_wallet_.azurehsmwallet.md#removeaccount)
* [signPersonalMessage](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)
* [signTransaction](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)
* [signTypedData](_wallets_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)

## Constructors

### constructor

+ **new AzureHSMWallet**\(`vaultName`: string\): [_AzureHSMWallet_](_wallets_azure_hsm_wallet_.azurehsmwallet.md)

_Defined in_ [_packages/contractkit/src/wallets/azure-hsm-wallet.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L14)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |

**Returns:** [_AzureHSMWallet_](_wallets_azure_hsm_wallet_.azurehsmwallet.md)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: [Address](../modules/_base_.md#address), `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_computeSharedSecret_](_wallets_wallet_.walletbase.md#computesharedsecret)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L157)

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_decrypt_](_wallets_wallet_.walletbase.md#decrypt)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:149_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L149)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getAccounts

▸ **getAccounts**\(\): [_Address_](../modules/_base_.md#address)_\[\]_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_getAccounts_](_wallets_remote_wallet_.remotewallet.md#getaccounts)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_getAccounts_](_wallets_wallet_.walletbase.md#getaccounts)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L62)

Get a list of accounts in the remote wallet

**Returns:** [_Address_](../modules/_base_.md#address)_\[\]_

### getAddressFromKeyName

▸ **getAddressFromKeyName**\(`keyName`: string\): _Promise‹_[_Address_](../modules/_base_.md#address)_›_

_Defined in_ [_packages/contractkit/src/wallets/azure-hsm-wallet.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/azure-hsm-wallet.ts#L53)

Returns the EVM address for the given key Useful for initially getting the 'from' field given a keyName

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keyName` | string | Azure KeyVault key name |

**Returns:** _Promise‹_[_Address_](../modules/_base_.md#address)_›_

### hasAccount

▸ **hasAccount**\(`address?`: [Address](../modules/_base_.md#address)\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_hasAccount_](_wallets_remote_wallet_.remotewallet.md#hasaccount)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_hasAccount_](_wallets_wallet_.walletbase.md#hasaccount)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:71_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L71)

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | [Address](../modules/_base_.md#address) | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_init_](_wallets_remote_wallet_.remotewallet.md#init)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L21)

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### isSetupFinished

▸ **isSetupFinished**\(\): _boolean_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_isSetupFinished_](_wallets_remote_wallet_.remotewallet.md#issetupfinished)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L111)

**Returns:** _boolean_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_removeAccount_](_wallets_wallet_.walletbase.md#removeaccount)

_Defined in_ [_packages/contractkit/src/wallets/wallet.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L52)

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: [Address](../modules/_base_.md#address), `data`: string\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signPersonalMessage_](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signPersonalMessage_](_wallets_wallet_.walletbase.md#signpersonalmessage)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L90)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: Tx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTransaction_](_wallets_remote_wallet_.remotewallet.md#signtransaction)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTransaction_](_wallets_wallet_.walletbase.md#signtransaction)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L80)

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | Tx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_RemoteWallet_](_wallets_remote_wallet_.remotewallet.md)_._[_signTypedData_](_wallets_remote_wallet_.remotewallet.md#signtypeddata)

_Overrides_ [_WalletBase_](_wallets_wallet_.walletbase.md)_._[_signTypedData_](_wallets_wallet_.walletbase.md#signtypeddata)

_Defined in_ [_packages/contractkit/src/wallets/remote-wallet.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L100)

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

