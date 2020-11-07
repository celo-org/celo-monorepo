# Class: AwsHsmSigner

## Hierarchy

* **AwsHsmSigner**

## Implements

* [Signer](../interfaces/_wallets_signers_signer_.signer.md)

## Index

### Constructors

* [constructor](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#constructor)

### Methods

* [computeSharedSecret](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#computesharedsecret)
* [decrypt](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#decrypt)
* [getNativeKey](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#getnativekey)
* [signPersonalMessage](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signpersonalmessage)
* [signTransaction](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signtransaction)
* [signTypedData](_wallets_signers_aws_hsm_signer_.awshsmsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new AwsHsmSigner**(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber): *[AwsHsmSigner](_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`kms` | KMS |
`keyId` | string |
`publicKey` | BigNumber |

**Returns:** *[AwsHsmSigner](_wallets_signers_aws_hsm_signer_.awshsmsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:108](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L108)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹[Signature](_utils_signature_utils_.signature.md)›*

*Defined in [packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹[Signature](_utils_signature_utils_.signature.md)›*
