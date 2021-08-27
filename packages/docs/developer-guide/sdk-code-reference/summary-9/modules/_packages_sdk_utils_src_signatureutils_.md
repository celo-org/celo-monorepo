# packages/sdk/utils/src/signatureUtils

## Index

### References

* [NativeSigner](_packages_sdk_utils_src_signatureutils_.md#nativesigner)
* [POP\_SIZE](_packages_sdk_utils_src_signatureutils_.md#pop_size)
* [Signature](_packages_sdk_utils_src_signatureutils_.md#signature)
* [Signer](_packages_sdk_utils_src_signatureutils_.md#signer)
* [serializeSignature](_packages_sdk_utils_src_signatureutils_.md#serializesignature)

### Functions

* [LocalSigner](_packages_sdk_utils_src_signatureutils_.md#localsigner)
* [addressToPublicKey](_packages_sdk_utils_src_signatureutils_.md#addresstopublickey)
* [guessSigner](_packages_sdk_utils_src_signatureutils_.md#guesssigner)
* [hashMessage](_packages_sdk_utils_src_signatureutils_.md#hashmessage)
* [hashMessageWithPrefix](_packages_sdk_utils_src_signatureutils_.md#hashmessagewithprefix)
* [parseSignature](_packages_sdk_utils_src_signatureutils_.md#parsesignature)
* [parseSignatureWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#parsesignaturewithoutprefix)
* [recoverEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasigner)
* [signMessage](_packages_sdk_utils_src_signatureutils_.md#signmessage)
* [signMessageWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#signmessagewithoutprefix)
* [signedMessageToPublicKey](_packages_sdk_utils_src_signatureutils_.md#signedmessagetopublickey)
* [verifyEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#verifyeip712typeddatasigner)
* [verifySignature](_packages_sdk_utils_src_signatureutils_.md#verifysignature)

### Object literals

* [SignatureUtils](_packages_sdk_utils_src_signatureutils_.md#const-signatureutils)

## References

### NativeSigner

• **NativeSigner**:

### POP\_SIZE

• **POP\_SIZE**:

### Signature

• **Signature**:

### Signer

• **Signer**:

### serializeSignature

• **serializeSignature**:

## Functions

### LocalSigner

▸ **LocalSigner**\(`privateKey`: string\): _Signer_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L61)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `privateKey` | string |

**Returns:** _Signer_

### addressToPublicKey

▸ **addressToPublicKey**\(`signer`: string, `signFn`: function\): _Promise‹string›_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L35)

**Parameters:**

▪ **signer**: _string_

▪ **signFn**: _function_

▸ \(`message`: string, `signer`: string\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signer` | string |

**Returns:** _Promise‹string›_

### guessSigner

▸ **guessSigner**\(`message`: string, `signature`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L166)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signature` | string |

**Returns:** _string_

### hashMessage

▸ **hashMessage**\(`message`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |

**Returns:** _string_

### hashMessageWithPrefix

▸ **hashMessageWithPrefix**\(`message`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |

**Returns:** _string_

### parseSignature

▸ **parseSignature**\(`message`: string, `signature`: string, `signer`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:111_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L111)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signature` | string |
| `signer` | string |

**Returns:** _object_

* **r**: _string_
* **s**: _string_
* **v**: _number_

### parseSignatureWithoutPrefix

▸ **parseSignatureWithoutPrefix**\(`messageHash`: string, `signature`: string, `signer`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L115)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `messageHash` | string |
| `signature` | string |
| `signer` | string |

**Returns:** _object_

* **r**: _string_
* **s**: _string_
* **v**: _number_

### recoverEIP712TypedDataSigner

▸ **recoverEIP712TypedDataSigner**\(`typedData`: [EIP712TypedData](), `signature`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:133_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L133)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | [EIP712TypedData]() |
| `signature` | string |

**Returns:** _string_

### signMessage

▸ **signMessage**\(`message`: string, `privateKey`: string, `address`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L80)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `privateKey` | string |
| `address` | string |

**Returns:** _object_

* **r**: _any_ = ethjsutil.bufferToHex\(r\)
* **s**: _any_ = ethjsutil.bufferToHex\(s\)
* **v**: _any_

### signMessageWithoutPrefix

▸ **signMessageWithoutPrefix**\(`messageHash`: string, `privateKey`: string, `address`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L84)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `messageHash` | string |
| `privateKey` | string |
| `address` | string |

**Returns:** _object_

* **r**: _any_ = ethjsutil.bufferToHex\(r\)
* **s**: _any_ = ethjsutil.bufferToHex\(s\)
* **v**: _any_

### signedMessageToPublicKey

▸ **signedMessageToPublicKey**\(`message`: string, `v`: number, `r`: string, `s`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `v` | number |
| `r` | string |
| `s` | string |

**Returns:** _string_

### verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**\(`typedData`: [EIP712TypedData](), `signature`: string, `signer`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L157)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | [EIP712TypedData]() |
| `signature` | string |
| `signer` | string |

**Returns:** _boolean_

### verifySignature

▸ **verifySignature**\(`message`: string, `signature`: string, `signer`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L102)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signature` | string |
| `signer` | string |

**Returns:** _boolean_

## Object literals

### `Const` SignatureUtils

### ▪ **SignatureUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:213_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L213)

### LocalSigner

• **LocalSigner**: [_LocalSigner_](_packages_sdk_utils_src_signatureutils_.md#localsigner)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:215_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L215)

### NativeSigner

• **NativeSigner**: _NativeSigner_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:214_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L214)

### parseSignature

• **parseSignature**: [_parseSignature_](_packages_sdk_utils_src_signatureutils_.md#parsesignature)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:218_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L218)

### parseSignatureWithoutPrefix

• **parseSignatureWithoutPrefix**: [_parseSignatureWithoutPrefix_](_packages_sdk_utils_src_signatureutils_.md#parsesignaturewithoutprefix)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:219_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L219)

### recoverEIP712TypedDataSigner

• **recoverEIP712TypedDataSigner**: [_recoverEIP712TypedDataSigner_](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasigner)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:221_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L221)

### serializeSignature

• **serializeSignature**: _serializeSignature_

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:220_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L220)

### signMessage

• **signMessage**: [_signMessage_](_packages_sdk_utils_src_signatureutils_.md#signmessage)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:216_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L216)

### signMessageWithoutPrefix

• **signMessageWithoutPrefix**: [_signMessageWithoutPrefix_](_packages_sdk_utils_src_signatureutils_.md#signmessagewithoutprefix)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:217_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L217)

### verifyEIP712TypedDataSigner

• **verifyEIP712TypedDataSigner**: [_verifyEIP712TypedDataSigner_](_packages_sdk_utils_src_signatureutils_.md#verifyeip712typeddatasigner)

_Defined in_ [_packages/sdk/utils/src/signatureUtils.ts:222_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L222)

