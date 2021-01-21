# AwsHsmSigner

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

### constructor

+ **new AwsHsmSigner**\(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber\): [_AwsHsmSigner_](_aws_hsm_signer_.awshsmsigner.md)

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L24)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kms` | KMS |
| `keyId` | string |
| `publicKey` | BigNumber |

**Returns:** [_AwsHsmSigner_](_aws_hsm_signer_.awshsmsigner.md)

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L115)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`_ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L109)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L105)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹Signature›_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L82)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹Signature›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: RLPEncodedTx\): _Promise‹Signature›_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | RLPEncodedTx |

**Returns:** _Promise‹Signature›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹Signature›_

_Defined in_ [_wallet-hsm-aws/src/aws-hsm-signer.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm-aws/src/aws-hsm-signer.ts#L94)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹Signature›_

