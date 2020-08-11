# Class: AwsHsmSigner

## Hierarchy

* **AwsHsmSigner**

## Implements

* [Signer](../interfaces/_contractkit_src_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md#constructor)

### Methods

* [getNativeKey](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md#getnativekey)
* [signPersonalMessage](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signpersonalmessage)
* [signTransaction](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signtransaction)

## Constructors

###  constructor

\+ **new AwsHsmSigner**(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber): *[AwsHsmSigner](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

*Defined in [contractkit/src/wallets/signers/aws-hsm-signer.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`kms` | KMS |
`keyId` | string |
`publicKey` | BigNumber |

**Returns:** *[AwsHsmSigner](_contractkit_src_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

## Methods

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [contractkit/src/wallets/signers/aws-hsm-signer.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L94)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*

*Defined in [contractkit/src/wallets/signers/aws-hsm-signer.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)): *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*

*Defined in [contractkit/src/wallets/signers/aws-hsm-signer.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹[Signature](_contractkit_src_utils_signature_utils_.signature.md)›*
