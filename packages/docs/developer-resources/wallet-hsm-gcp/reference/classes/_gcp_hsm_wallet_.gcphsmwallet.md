# Class: GcpHsmWallet

A Cloud HSM wallet built on GCP.

## Hierarchy

* RemoteWallet‹[GcpHsmSigner](_gcp_hsm_signer_.gcphsmsigner.md)›

  ↳ **GcpHsmWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Constructors

* [constructor](_gcp_hsm_wallet_.gcphsmwallet.md#constructor)

### Properties

* [isSetupFinished](_gcp_hsm_wallet_.gcphsmwallet.md#issetupfinished)

### Methods

* [computeSharedSecret](_gcp_hsm_wallet_.gcphsmwallet.md#computesharedsecret)
* [decrypt](_gcp_hsm_wallet_.gcphsmwallet.md#decrypt)
* [getAccounts](_gcp_hsm_wallet_.gcphsmwallet.md#getaccounts)
* [getAddressFromVersionName](_gcp_hsm_wallet_.gcphsmwallet.md#getaddressfromversionname)
* [hasAccount](_gcp_hsm_wallet_.gcphsmwallet.md#hasaccount)
* [init](_gcp_hsm_wallet_.gcphsmwallet.md#init)
* [removeAccount](_gcp_hsm_wallet_.gcphsmwallet.md#removeaccount)
* [signPersonalMessage](_gcp_hsm_wallet_.gcphsmwallet.md#signpersonalmessage)
* [signTransaction](_gcp_hsm_wallet_.gcphsmwallet.md#signtransaction)
* [signTypedData](_gcp_hsm_wallet_.gcphsmwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new GcpHsmWallet**(`versionName`: string): *[GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md)*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-wallet.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-wallet.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`versionName` | string |

**Returns:** *[GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md)*

## Properties

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[isSetupFinished](_gcp_hsm_wallet_.gcphsmwallet.md#issetupfinished)*

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[computeSharedSecret](_gcp_hsm_wallet_.gcphsmwallet.md#computesharedsecret)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[decrypt](_gcp_hsm_wallet_.gcphsmwallet.md#decrypt)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[getAccounts](_gcp_hsm_wallet_.gcphsmwallet.md#getaccounts)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  getAddressFromVersionName

▸ **getAddressFromVersionName**(`versionName`: string): *Promise‹Address›*

*Defined in [wallet-hsm-gcp/src/gcp-hsm-wallet.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-gcp/src/gcp-hsm-wallet.ts#L78)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`versionName` | string | GCP version name for the HSM  |

**Returns:** *Promise‹Address›*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[hasAccount](_gcp_hsm_wallet_.gcphsmwallet.md#hasaccount)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[init](_gcp_hsm_wallet_.gcphsmwallet.md#init)*

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[removeAccount](_gcp_hsm_wallet_.gcphsmwallet.md#removeaccount)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[signPersonalMessage](_gcp_hsm_wallet_.gcphsmwallet.md#signpersonalmessage)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[signTransaction](_gcp_hsm_wallet_.gcphsmwallet.md#signtransaction)*

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

*Inherited from [GcpHsmWallet](_gcp_hsm_wallet_.gcphsmwallet.md).[signTypedData](_gcp_hsm_wallet_.gcphsmwallet.md#signtypeddata)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
