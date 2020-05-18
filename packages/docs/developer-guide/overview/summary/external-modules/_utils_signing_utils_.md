# utils/signing-utils

## Index

### Interfaces

* [RLPEncodedTx]()

### Functions

* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [recoverMessageSigner](_utils_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_utils_signing_utils_.md#verifyeip712typeddatasigner)

## Functions

### chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**\(`chainId`: number\): _number_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `chainId` | number |

**Returns:** _number_

### encodeTransaction

▸ **encodeTransaction**\(`rlpEncoded`: [RLPEncodedTx](), `signature`: object\): _Promise‹EncodedTransaction›_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L120)

**Parameters:**

▪ **rlpEncoded**: [_RLPEncodedTx_]()

▪ **signature**: _object_

| Name | Type |
| :--- | :--- |
| `r` | Buffer |
| `s` | Buffer |
| `v` | number |

**Returns:** _Promise‹EncodedTransaction›_

### getHashFromEncoded

▸ **getHashFromEncoded**\(`rlpEncode`: string\): _string_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rlpEncode` | string |

**Returns:** _string_

### recoverMessageSigner

▸ **recoverMessageSigner**\(`signingDataHex`: string, `signedData`: string\): _string_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:188_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L188)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signingDataHex` | string |
| `signedData` | string |

**Returns:** _string_

### recoverTransaction

▸ **recoverTransaction**\(`rawTx`: string\): _\[Tx, string\]_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L156)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTx` | string |

**Returns:** _\[Tx, string\]_

### rlpEncodedTx

▸ **rlpEncodedTx**\(`tx`: Tx\): [_RLPEncodedTx_]()

_Defined in_ [_contractkit/src/utils/signing-utils.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** [_RLPEncodedTx_]()

### verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**\(`typedData`: [EIP712TypedData](), `signedData`: string, `expectedAddress`: string\): _boolean_

_Defined in_ [_contractkit/src/utils/signing-utils.ts:198_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L198)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | [EIP712TypedData]() |
| `signedData` | string |
| `expectedAddress` | string |

**Returns:** _boolean_

