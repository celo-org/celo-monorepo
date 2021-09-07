# Class: AwsHsmSigner

## Hierarchy

* **AwsHsmSigner**

## Implements

* Signer

## Index

### Constructors

* [constructor](_aws_hsm_signer_.awshsmsigner.md#constructor)

### Methods

* [computeSharedSecret](_aws_hsm_signer_.awshsmsigner.md#computesharedsecret)
* [decrypt](_aws_hsm_signer_.awshsmsigner.md#decrypt)
* [getNativeKey](_aws_hsm_signer_.awshsmsigner.md#getnativekey)
* [signPersonalMessage](_aws_hsm_signer_.awshsmsigner.md#signpersonalmessage)
* [signTransaction](_aws_hsm_signer_.awshsmsigner.md#signtransaction)
* [signTypedData](_aws_hsm_signer_.awshsmsigner.md#signtypeddata)

## Constructors

###  constructor

\+ **new AwsHsmSigner**(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber): *[AwsHsmSigner](_aws_hsm_signer_.awshsmsigner.md)*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`kms` | KMS |
`keyId` | string |
`publicKey` | BigNumber |

**Returns:** *[AwsHsmSigner](_aws_hsm_signer_.awshsmsigner.md)*

## Methods

###  computeSharedSecret

▸ **computeSharedSecret**(`_publicKey`: string): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`_publicKey` | string |

**Returns:** *Promise‹Buffer‹››*

___

###  decrypt

▸ **decrypt**(`_ciphertext`: Buffer): *Promise‹Buffer‹››*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`_ciphertext` | Buffer |

**Returns:** *Promise‹Buffer‹››*

___

###  getNativeKey

▸ **getNativeKey**(): *string*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L105)*

**Returns:** *string*

___

###  signPersonalMessage

▸ **signPersonalMessage**(`data`: string): *Promise‹Signature›*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹Signature›*

___

###  signTransaction

▸ **signTransaction**(`addToV`: number, `encodedTx`: RLPEncodedTx): *Promise‹Signature›*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`addToV` | number |
`encodedTx` | RLPEncodedTx |

**Returns:** *Promise‹Signature›*

___

###  signTypedData

▸ **signTypedData**(`typedData`: EIP712TypedData): *Promise‹Signature›*

*Defined in [wallet-hsm-aws/src/aws-hsm-signer.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |

**Returns:** *Promise‹Signature›*
