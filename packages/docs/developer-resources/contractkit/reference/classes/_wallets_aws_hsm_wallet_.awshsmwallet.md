# Class: AwsHsmWallet

A Cloud HSM wallet built on AWS KMS
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html
When using the default credentials, it's expected to set the
aws_access_key_id and aws_secret_access_key in ~/.aws/credentials

## Hierarchy

  ↳ [RemoteWallet](_wallets_remote_wallet_.remotewallet.md)‹[AwsHsmSigner](_wallets_signers_aws_hsm_signer_.awshsmsigner.md)›

  ↳ **AwsHsmWallet**

## Implements

* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)
* [ReadOnlyWallet](../interfaces/_wallets_wallet_.readonlywallet.md)

## Index

### Constructors

* [constructor](_wallets_aws_hsm_wallet_.awshsmwallet.md#constructor)

### Methods

* [decrypt](_wallets_aws_hsm_wallet_.awshsmwallet.md#decrypt)
* [getAccounts](_wallets_aws_hsm_wallet_.awshsmwallet.md#getaccounts)
* [getAddressFromKeyId](_wallets_aws_hsm_wallet_.awshsmwallet.md#getaddressfromkeyid)
* [hasAccount](_wallets_aws_hsm_wallet_.awshsmwallet.md#hasaccount)
* [init](_wallets_aws_hsm_wallet_.awshsmwallet.md#init)
* [isSetupFinished](_wallets_aws_hsm_wallet_.awshsmwallet.md#issetupfinished)
* [signPersonalMessage](_wallets_aws_hsm_wallet_.awshsmwallet.md#signpersonalmessage)
* [signTransaction](_wallets_aws_hsm_wallet_.awshsmwallet.md#signtransaction)
* [signTypedData](_wallets_aws_hsm_wallet_.awshsmwallet.md#signtypeddata)

## Constructors

###  constructor

\+ **new AwsHsmWallet**(`awsCredentials?`: KMS.ClientConfiguration): *[AwsHsmWallet](_wallets_aws_hsm_wallet_.awshsmwallet.md)*

*Defined in [packages/contractkit/src/wallets/aws-hsm-wallet.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/aws-hsm-wallet.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`awsCredentials?` | KMS.ClientConfiguration |

**Returns:** *[AwsHsmWallet](_wallets_aws_hsm_wallet_.awshsmwallet.md)*

## Methods

###  decrypt

▸ **decrypt**(`address`: string, `ciphertext`: Buffer): *Promise‹Buffer‹››*

*Inherited from [WalletBase](_wallets_wallet_.walletbase.md).[decrypt](_wallets_wallet_.walletbase.md#decrypt)*

*Defined in [packages/contractkit/src/wallets/wallet.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/wallet.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getAccounts

▸ **getAccounts**(): *[Address](../modules/_base_.md#address)[]*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[getAccounts](_wallets_remote_wallet_.remotewallet.md#getaccounts)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[getAccounts](_wallets_wallet_.walletbase.md#getaccounts)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L62)*

Get a list of accounts in the remote wallet

**Returns:** *[Address](../modules/_base_.md#address)[]*

___

###  getAddressFromKeyId

▸ **getAddressFromKeyId**(`keyId`: string): *Promise‹[Address](../modules/_base_.md#address)›*

*Defined in [packages/contractkit/src/wallets/aws-hsm-wallet.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/aws-hsm-wallet.ts#L86)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type |
------ | ------ |
`keyId` | string |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)›*

___

###  hasAccount

▸ **hasAccount**(`address?`: [Address](../modules/_base_.md#address)): *boolean*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[hasAccount](_wallets_remote_wallet_.remotewallet.md#hasaccount)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[hasAccount](_wallets_wallet_.walletbase.md#hasaccount)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L71)*

Returns true if account is in the remote wallet

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address?` | [Address](../modules/_base_.md#address) | Account to check  |

**Returns:** *boolean*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[init](_wallets_remote_wallet_.remotewallet.md#init)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L21)*

Discovers wallet accounts and caches results in memory
Idempotent to ensure multiple calls are benign

**Returns:** *Promise‹void›*

___

###  isSetupFinished

▸ **isSetupFinished**(): *boolean*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[isSetupFinished](_wallets_remote_wallet_.remotewallet.md#issetupfinished)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L111)*

**Returns:** *boolean*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`address`: [Address](../modules/_base_.md#address), `data`: string): *Promise‹string›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signPersonalMessage](_wallets_remote_wallet_.remotewallet.md#signpersonalmessage)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signPersonalMessage](_wallets_wallet_.walletbase.md#signpersonalmessage)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L90)*

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

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTransaction](_wallets_remote_wallet_.remotewallet.md#signtransaction)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTransaction](_wallets_wallet_.walletbase.md#signtransaction)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L80)*

Signs the EVM transaction using the signer pulled from the from field

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`txParams` | Tx | EVM transaction  |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signTypedData

▸ **signTypedData**(`address`: [Address](../modules/_base_.md#address), `typedData`: EIP712TypedData): *Promise‹string›*

*Inherited from [RemoteWallet](_wallets_remote_wallet_.remotewallet.md).[signTypedData](_wallets_remote_wallet_.remotewallet.md#signtypeddata)*

*Overrides [WalletBase](_wallets_wallet_.walletbase.md).[signTypedData](_wallets_wallet_.walletbase.md#signtypeddata)*

*Defined in [packages/contractkit/src/wallets/remote-wallet.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/remote-wallet.ts#L100)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`address` | [Address](../modules/_base_.md#address) | Address of the account to sign with |
`typedData` | EIP712TypedData | the typed data object |

**Returns:** *Promise‹string›*

Signature hex string (order: rsv)
