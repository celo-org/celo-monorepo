# AwsHsmSigner

## Hierarchy

* **AwsHsmSigner**

## Implements

* [Signer]()

## Index

### Constructors

* [constructor]()

### Methods

* [computeSharedSecret]()
* [decrypt]()
* [getNativeKey]()
* [signPersonalMessage]()
* [signTransaction]()
* [signTypedData]()

## Constructors

### constructor

+ **new AwsHsmSigner**\(`kms`: KMS, `keyId`: string, `publicKey`: BigNumber\): [_AwsHsmSigner_]()

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kms` | KMS |
| `keyId` | string |
| `publicKey` | BigNumber |

**Returns:** [_AwsHsmSigner_]()

## Methods

### computeSharedSecret

▸ **computeSharedSecret**\(`_publicKey`: string\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L118)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_publicKey` | string |

**Returns:** _Promise‹Buffer‹››_

### decrypt

▸ **decrypt**\(`_ciphertext`: Buffer\): _Promise‹Buffer‹››_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:112_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L112)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `_ciphertext` | Buffer |

**Returns:** _Promise‹Buffer‹››_

### getNativeKey

▸ **getNativeKey**\(\): _string_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L108)

**Returns:** _string_

### signPersonalMessage

▸ **signPersonalMessage**\(`data`: string\): _Promise‹_[_Signature_]()_›_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L85)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** _Promise‹_[_Signature_]()_›_

### signTransaction

▸ **signTransaction**\(`addToV`: number, `encodedTx`: [RLPEncodedTx]()\): _Promise‹_[_Signature_]()_›_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L73)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `addToV` | number |
| `encodedTx` | [RLPEncodedTx]() |

**Returns:** _Promise‹_[_Signature_]()_›_

### signTypedData

▸ **signTypedData**\(`typedData`: EIP712TypedData\): _Promise‹_[_Signature_]()_›_

_Defined in_ [_packages/contractkit/src/wallets/signers/aws-hsm-signer.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/wallets/signers/aws-hsm-signer.ts#L97)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |

**Returns:** _Promise‹_[_Signature_]()_›_

