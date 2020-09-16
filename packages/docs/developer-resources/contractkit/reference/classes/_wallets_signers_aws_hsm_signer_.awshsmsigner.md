# Class: AwsHsmSigner

## Hierarchy

* **AwsHsmSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#constructor)

### Methods

* [decrypt](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#decrypt)
* [getNativeKey](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signtransaction)

## Constructors

###  constructor

\+ **new AwsHsmSigner**(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber): *[AwsHsmSigner](_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kms` | KMS |
`keyId` | string |
`publicKey` | BigNumber |

**Returns:** *[AwsHsmSigner](_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

## Methods

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L96)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹[Signature](_utils_signature_utils_.signature.md)›*
