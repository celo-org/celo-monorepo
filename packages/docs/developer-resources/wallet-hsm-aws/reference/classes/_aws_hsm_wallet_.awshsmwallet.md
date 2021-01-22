# Class: AwsHsmWallet

A Cloud HSM wallet built on AWS KMS
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html
When using the default credentials, it's expected to set the
aws_access_key_id and aws_secret_access_key in ~/.aws/credentials

## Hierarchy

* RemoteWallet‹[AwsHsmSigner](_aws_hsm_signer_.awshsmsigner.md)›

  ↳ **AwsHsmWallet**

## Implements

* ReadOnlyWallet
* ReadOnlyWallet
* ReadOnlyWallet

## Index

### Constructors

* [constructor](_aws_hsm_wallet_.awshsmwallet.md#constructor)

### Properties

* [isSetupFinished](_aws_hsm_wallet_.awshsmwallet.md#issetupfinished)

### Methods

* [computeSharedSecret](_aws_hsm_wallet_.awshsmwallet.md#computesharedsecret)
* [decrypt](_aws_hsm_wallet_.awshsmwallet.md#decrypt)
* [getAccounts](_aws_hsm_wallet_.awshsmwallet.md#getaccounts)
* [getAddressFromKeyId](_aws_hsm_wallet_.awshsmwallet.md#getaddressfromkeyid)
* [hasAccount](_aws_hsm_wallet_.awshsmwallet.md#hasaccount)
* [init](_aws_hsm_wallet_.awshsmwallet.md#init)
* [removeAccount](_aws_hsm_wallet_.awshsmwallet.md#removeaccount)
* [signPersonalMessage](_aws_hsm_wallet_.awshsmwallet.md#signpersonalmessage)
* [signTransaction](_aws_hsm_wallet_.awshsmwallet.md#signtransaction)
* [signTypedData](_aws_hsm_wallet_.awshsmwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new AwsHsmWallet**(`awsCredentials?`: KMS.ClientConfiguration): *[AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md)*

*Defined in [wallet-hsm-aws/src/aws-hsm-wallet.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-wallet.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`awsCredentials?` | KMS.ClientConfiguration |

**Returns:** *[AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md)*

## Properties

###  isSetupFinished

• **isSetupFinished**: *function*

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[isSetupFinished](_aws_hsm_wallet_.awshsmwallet.md#issetupfinished)*

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ (): *boolean*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`address`: Address, `publicKey`: string): *Promise‹Buffer›*

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[computeSharedSecret](_aws_hsm_wallet_.awshsmwallet.md#computesharedsecret)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[decrypt](_aws_hsm_wallet_.awshsmwallet.md#decrypt)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[getAccounts](_aws_hsm_wallet_.awshsmwallet.md#getaccounts)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** *Address[]*

___

###  getAddressFromKeyId

▸ **getAddressFromKeyId**(`keyId`: string): *Promise‹Address›*

*Defined in [wallet-hsm-aws/src/aws-hsm-wallet.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-wallet.ts#L92)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type |
------ | ------ |
`keyId` | string |

**Returns:** *Promise‹Address›*

___

###  hasAccount

▸ **hasAccount**(`address?`: Address): *boolean*

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[hasAccount](_aws_hsm_wallet_.awshsmwallet.md#hasaccount)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[init](_aws_hsm_wallet_.awshsmwallet.md#init)*

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  removeAccount

▸ **removeAccount**(`_address`: string): *void*

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[removeAccount](_aws_hsm_wallet_.awshsmwallet.md#removeaccount)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[signPersonalMessage](_aws_hsm_wallet_.awshsmwallet.md#signpersonalmessage)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[signTransaction](_aws_hsm_wallet_.awshsmwallet.md#signtransaction)*

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

*Inherited from [AwsHsmWallet](_aws_hsm_wallet_.awshsmwallet.md).[signTypedData](_aws_hsm_wallet_.awshsmwallet.md#signtypeddata)*

*Overrides void*

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | Address | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
