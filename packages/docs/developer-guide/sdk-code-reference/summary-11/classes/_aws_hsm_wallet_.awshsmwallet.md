# AwsHsmWallet

A Cloud HSM wallet built on AWS KMS [https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html) When using the default credentials, it's expected to set the aws\_access\_key\_id and aws\_secret\_access\_key in ~/.aws/credentials

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

### constructor

+ **new AwsHsmWallet**\(`awsCredentials?`: KMS.ClientConfiguration\): [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-wallet.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-wallet.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `awsCredentials?` | KMS.ClientConfiguration |

**Returns:** [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)

## Properties

### isSetupFinished

• **isSetupFinished**: _function_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_isSetupFinished_](_aws_hsm_wallet_.awshsmwallet.md#issetupfinished)

Defined in wallet-remote/lib/remote-wallet.d.ts:51

#### Type declaration:

▸ \(\): _boolean_

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`address`: Address, `publicKey`: string\): _Promise‹Buffer›_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_computeSharedSecret_](_aws_hsm_wallet_.awshsmwallet.md#computesharedsecret)

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

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_decrypt_](_aws_hsm_wallet_.awshsmwallet.md#decrypt)

Defined in wallet-base/lib/wallet-base.d.ts:60

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `ciphertext` | Buffer |

**Returns:** _Promise‹Buffer›_

### getAccounts

▸ **getAccounts**\(\): _Address\[\]_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_getAccounts_](_aws_hsm_wallet_.awshsmwallet.md#getaccounts)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:27

Get a list of accounts in the remote wallet

**Returns:** _Address\[\]_

### getAddressFromKeyId

▸ **getAddressFromKeyId**\(`keyId`: string\): _Promise‹Address›_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-wallet.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-wallet.ts#L92)

Returns the EVM address for the given key Useful for initially getting the 'from' field given a keyName

**Parameters:**

| Name | Type |
| :--- | :--- |
| `keyId` | string |

**Returns:** _Promise‹Address›_

### hasAccount

▸ **hasAccount**\(`address?`: Address\): _boolean_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_hasAccount_](_aws_hsm_wallet_.awshsmwallet.md#hasaccount)

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

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_init_](_aws_hsm_wallet_.awshsmwallet.md#init)

Defined in wallet-remote/lib/remote-wallet.d.ts:15

Discovers wallet accounts and caches results in memory Idempotent to ensure multiple calls are benign

**Returns:** _Promise‹void›_

### removeAccount

▸ **removeAccount**\(`_address`: string\): _void_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_removeAccount_](_aws_hsm_wallet_.awshsmwallet.md#removeaccount)

Defined in wallet-base/lib/wallet-base.d.ts:23

Removes the account with the given address. Needs to be implemented by subclass, otherwise throws error

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_address` | string |

**Returns:** _void_

### signPersonalMessage

▸ **signPersonalMessage**\(`address`: Address, `data`: string\): _Promise‹string›_

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_signPersonalMessage_](_aws_hsm_wallet_.awshsmwallet.md#signpersonalmessage)

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

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_signTransaction_](_aws_hsm_wallet_.awshsmwallet.md#signtransaction)

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

_Inherited from_ [_AwsHsmWallet_](_aws_hsm_wallet_.awshsmwallet.md)_._[_signTypedData_](_aws_hsm_wallet_.awshsmwallet.md#signtypeddata)

_Overrides void_

Defined in wallet-remote/lib/remote-wallet.d.ts:49

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `address` | Address | Address of the account to sign with |
| `typedData` | EIP712TypedData | the typed data object |

**Returns:** _Promise‹string›_

Signature hex string \(order: rsv\)

