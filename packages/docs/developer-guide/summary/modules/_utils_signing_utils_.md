# utils/signing-utils

## Index

### Interfaces

* [RLPEncodedTx]()

### Variables

* [publicKeyPrefix](_utils_signing_utils_.md#const-publickeyprefix)
* [sixtyFour](_utils_signing_utils_.md#const-sixtyfour)
* [thirtyTwo](_utils_signing_utils_.md#const-thirtytwo)

### Functions

* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [decodeSig](_utils_signing_utils_.md#decodesig)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [extractSignature](_utils_signing_utils_.md#extractsignature)
* [getAddressFromPublicKey](_utils_signing_utils_.md#getaddressfrompublickey)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [recoverKeyIndex](_utils_signing_utils_.md#recoverkeyindex)
* [recoverMessageSigner](_utils_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_utils_signing_utils_.md#verifyeip712typeddatasigner)
* [verifySignatureWithoutPrefix](_utils_signing_utils_.md#verifysignaturewithoutprefix)

## Variables

### `Const` publicKeyPrefix

• **publicKeyPrefix**: _number_ = 4

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L21)

### `Const` sixtyFour

• **sixtyFour**: _number_ = 64

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L22)

### `Const` thirtyTwo

• **thirtyTwo**: _number_ = 32

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L23)

## Functions

### chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**\(`chainId`: number\): _number_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `chainId` | number |

**Returns:** _number_

### decodeSig

▸ **decodeSig**\(`sig`: any\): _object_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:245_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L245)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sig` | any |

**Returns:** _object_

* **r**: _Buffer‹›_ = ethUtil.toBuffer\(r\) as Buffer
* **s**: _Buffer‹›_ = ethUtil.toBuffer\(s\) as Buffer
* **v**: _number_ = parseInt\(v, 16\)

### encodeTransaction

▸ **encodeTransaction**\(`rlpEncoded`: [RLPEncodedTx](), `signature`: object\): _Promise‹EncodedTransaction›_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L129)

**Parameters:**

▪ **rlpEncoded**: [_RLPEncodedTx_]()

▪ **signature**: _object_

| Name | Type |
| :--- | :--- |
| `r` | Buffer |
| `s` | Buffer |
| `v` | number |

**Returns:** _Promise‹EncodedTransaction›_

### extractSignature

▸ **extractSignature**\(`rawTx`: string\): _object_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:162_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L162)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTx` | string |

**Returns:** _object_

* **r**: _Buffer_
* **s**: _Buffer_
* **v**: _number_

### getAddressFromPublicKey

▸ **getAddressFromPublicKey**\(`publicKey`: BigNumber\): [_Address_](_base_.md#address)

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L278)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | BigNumber |

**Returns:** [_Address_](_base_.md#address)

### getHashFromEncoded

▸ **getHashFromEncoded**\(`rlpEncode`: string\): _string_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L40)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rlpEncode` | string |

**Returns:** _string_

### recoverKeyIndex

▸ **recoverKeyIndex**\(`signature`: Uint8Array, `publicKey`: BigNumber, `hash`: Uint8Array\): _number_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:257_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L257)

Attempts each recovery key to find a match

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signature` | Uint8Array |
| `publicKey` | BigNumber |
| `hash` | Uint8Array |

**Returns:** _number_

### recoverMessageSigner

▸ **recoverMessageSigner**\(`signingDataHex`: string, `signedData`: string\): _string_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:212_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L212)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signingDataHex` | string |
| `signedData` | string |

**Returns:** _string_

### recoverTransaction

▸ **recoverTransaction**\(`rawTx`: string\): _\[Tx, string\]_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:180_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L180)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTx` | string |

**Returns:** _\[Tx, string\]_

### rlpEncodedTx

▸ **rlpEncodedTx**\(`tx`: Tx\): [_RLPEncodedTx_]()

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L78)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** [_RLPEncodedTx_]()

### verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**\(`typedData`: EIP712TypedData, `signedData`: string, `expectedAddress`: string\): _boolean_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L222)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |
| `signedData` | string |
| `expectedAddress` | string |

**Returns:** _boolean_

### verifySignatureWithoutPrefix

▸ **verifySignatureWithoutPrefix**\(`messageHash`: string, `signature`: string, `signer`: string\): _boolean_

_Defined in_ [_packages/contractkit/src/utils/signing-utils.ts:232_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L232)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `messageHash` | string |
| `signature` | string |
| `signer` | string |

**Returns:** _boolean_

