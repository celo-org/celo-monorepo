# AzureHSMWallet

## Hierarchy

* RemoteWallet‹[AzureHSMSigner](_azure_hsm_signer_.azurehsmsigner.md)›

  ↳ **AzureHSMWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Constructors

* [constructor](_azure_hsm_wallet_.azurehsmwallet.md#constructor)

### Properties

* [isSetupFinished](_azure_hsm_wallet_.azurehsmwallet.md#issetupfinished)

### Methods

* [computeSharedSecret](_azure_hsm_wallet_.azurehsmwallet.md#computesharedsecret)
* [decrypt](_azure_hsm_wallet_.azurehsmwallet.md#decrypt)
* [getAccounts](_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)
* [getAddressFromKeyName](_azure_hsm_wallet_.azurehsmwallet.md#getaddressfromkeyname)
* [hasAccount](_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)
* [init](_azure_hsm_wallet_.azurehsmwallet.md#init)
* [removeAccount](_azure_hsm_wallet_.azurehsmwallet.md#removeaccount)
* [signPersonalMessage](_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)
* [signTransaction](_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)
* [signTypedData](_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)

## Constructors

### constructor

+ **new AzureHSMWallet**\(`vaultName`: string\): [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)

_Defined in_ [_wallet-hsm-azure/src/azure-hsm-wallet.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-wallet.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `vaultName` | string |

**Returns:** [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)

## Properties

### isSetupFinished

• **isSetupFinished**: _function_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_isSetupFinished_](_azure_hsm_wallet_.azurehsmwallet.md#issetupfinished)

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ \(\): _boolean_

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_computeSharedSecret_](_azure_hsm_wallet_.azurehsmwallet.md#computesharedsecret)

Defined in wallet-base/lib/wallet-base.d.ts:64

Computes the shared secret \(an ECDH key exchange object\) between two accounts

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | Address |
| `publicKey` | string |

**Returns:** _Promise‹Buffer›_

### decrypt

▸ **decrypt**\(`address`: string, `ciphertext`: Buffer\): _Promise‹Buffer›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_decrypt_](_azure_hsm_wallet_.azurehsmwallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_getAccounts_](_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** _Address\[\]_

### getAddressFromKeyName

▸ **getAddressFromKeyName**\(`keyName`: string\): _Promise‹Address›_

_Defined in_ [_wallet-hsm-azure/src/azure-hsm-wallet.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-wallet.ts#L50)

Returns the EVM address for the given key Useful for initially getting the 'from' field given a keyName

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `keyName` | string | Azure KeyVault key name |

**Returns:** _Promise‹Address›_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_hasAccount_](_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address?` | Address | Account to check |

**Returns:** _boolean_

### init

▸ **init**\(\): _Promise‹void›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_init_](_azure_hsm_wallet_.azurehsmwallet.md#init)

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_removeAccount_](_azure_hsm_wallet_.azurehsmwallet.md#removeaccount)

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_signPersonalMessage_](_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:43

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `data` | string | Hex string message to sign |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

### signTransaction

▸ **signTransaction**\(`txParams`: CeloTx\): _Promise‹EncodedTransaction›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_signTransaction_](_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:37

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `txParams` | CeloTx | EVM transaction |

**Returns:** _Promise‹EncodedTransaction›_

### signTypedData

▸ **signTypedData**\(`address`: Address, `typedData`: EIP712TypedData\): _Promise‹string›_

_Inherited from_ [_AzureHSMWallet_](_azure_hsm_wallet_.azurehsmwallet.md)_._[_signTypedData_](_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

