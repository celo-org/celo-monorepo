# Class: AwsHsmWallet

A Cloud HSM wallet built on AWS KMS
https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html
When using the default credentials, it's expected to set the
aws_access_key_id and aws_secret_access_key in ~/.aws/credentials

## Hierarchy

* any

  ↳ **AwsHsmWallet**

## Implements

* [Wallet](../interfaces/_wallets_wallet_.wallet.md)

## Index

### Constructors

* [constructor](_wallets_aws_hsm_wallet_.awshsmwallet.md#constructor)

### Methods

* [getAddressFromKeyId](_wallets_aws_hsm_wallet_.awshsmwallet.md#getaddressfromkeyid)

## Constructors

###  constructor

\+ **new AwsHsmWallet**(`awsCredentials?`: KMS.ClientConfiguration): *[AwsHsmWallet](_wallets_aws_hsm_wallet_.awshsmwallet.md)*

*Defined in [contractkit/src/wallets/aws-hsm-wallet.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/aws-hsm-wallet.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`awsCredentials?` | KMS.ClientConfiguration |

**Returns:** *[AwsHsmWallet](_wallets_aws_hsm_wallet_.awshsmwallet.md)*

## Methods

###  getAddressFromKeyId

▸ **getAddressFromKeyId**(`keyId`: string): *Promise‹[Address](../modules/_base_.md#address)›*

*Defined in [contractkit/src/wallets/aws-hsm-wallet.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/aws-hsm-wallet.ts#L87)*

Returns the EVM address for the given key
Useful for initially getting the 'from' field given a keyName

**Parameters:**

Name | Type |
------ | ------ |
`keyId` | string |

**Returns:** *Promise‹[Address](../modules/_base_.md#address)›*
