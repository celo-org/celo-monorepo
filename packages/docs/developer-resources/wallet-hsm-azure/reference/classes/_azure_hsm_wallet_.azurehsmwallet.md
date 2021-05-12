# Class: AzureHSMWallet

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

###  constructor

\+ **new AzureHSMWallet**(`vaultName`: string): *[AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md)*

*Defined in [wallet-hsm-azure/src/azure-hsm-wallet.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-wallet.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`vaultName` | string |

**Returns:** *[AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md)*

## Properties

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[isSetupFinished](_azure_hsm_wallet_.azurehsmwallet.md#issetupfinished)*

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[computeSharedSecret](_azure_hsm_wallet_.azurehsmwallet.md#computesharedsecret)*

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

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[decrypt](_azure_hsm_wallet_.azurehsmwallet.md#decrypt)*

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

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[getAccounts](_azure_hsm_wallet_.azurehsmwallet.md#getaccounts)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  getAddressFromKeyName

▸ **getAddressFromKeyName**(`keyName`: string): *Promise‹Address›*

*Defined in [wallet-hsm-azure/src/azure-hsm-wallet.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-azure/src/azure-hsm-wallet.ts#L50)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`keyName` | string | Azure KeyVault key name  |

**Returns:** *Promise‹Address›*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[hasAccount](_azure_hsm_wallet_.azurehsmwallet.md#hasaccount)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:32

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | Address | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[init](_azure_hsm_wallet_.azurehsmwallet.md#init)*

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[removeAccount](_azure_hsm_wallet_.azurehsmwallet.md#removeaccount)*

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

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[signPersonalMessage](_azure_hsm_wallet_.azurehsmwallet.md#signpersonalmessage)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:43

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

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[signTransaction](_azure_hsm_wallet_.azurehsmwallet.md#signtransaction)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:37

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | CeloTx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: Address, `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [AzureHSMWallet](_azure_hsm_wallet_.azurehsmwallet.md).[signTypedData](_azure_hsm_wallet_.azurehsmwallet.md#signtypeddata)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
