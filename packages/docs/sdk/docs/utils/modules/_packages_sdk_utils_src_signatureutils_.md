[@celo/utils](../README.md) › ["packages/sdk/utils/src/signatureUtils"](_packages_sdk_utils_src_signatureutils_.md)

# Module: "packages/sdk/utils/src/signatureUtils"

## Index

### References

* [NativeSigner](_packages_sdk_utils_src_signatureutils_.md#nativesigner)
* [POP_SIZE](_packages_sdk_utils_src_signatureutils_.md#pop_size)
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
* [recoverEIP712TypedDataSignerRsv](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasignerrsv)
* [recoverEIP712TypedDataSignerVrs](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasignervrs)
* [signMessage](_packages_sdk_utils_src_signatureutils_.md#signmessage)
* [signMessageWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#signmessagewithoutprefix)
* [signedMessageToPublicKey](_packages_sdk_utils_src_signatureutils_.md#signedmessagetopublickey)
* [verifyEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#verifyeip712typeddatasigner)
* [verifySignature](_packages_sdk_utils_src_signatureutils_.md#verifysignature)

### Object literals

* [SignatureUtils](_packages_sdk_utils_src_signatureutils_.md#const-signatureutils)

## References

###  NativeSigner

• **NativeSigner**:

___

###  POP_SIZE

• **POP_SIZE**:

___

###  Signature

• **Signature**:

___

###  Signer

• **Signer**:

___

###  serializeSignature

• **serializeSignature**:

## Functions

###  LocalSigner

▸ **LocalSigner**(`privateKey`: string): *Signer*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *Signer*

___

###  addressToPublicKey

▸ **addressToPublicKey**(`signer`: string, `signFn`: function): *Promise‹string›*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L35)*

**Parameters:**

▪ **signer**: *string*

▪ **signFn**: *function*

▸ (`message`: string, `signer`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signer` | string |

**Returns:** *Promise‹string›*

___

###  guessSigner

▸ **guessSigner**(`message`: string, `signature`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:203](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L203)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |

**Returns:** *string*

___

###  hashMessage

▸ **hashMessage**(`message`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  hashMessageWithPrefix

▸ **hashMessageWithPrefix**(`message`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  parseSignature

▸ **parseSignature**(`message`: string, `signature`: string, `signer`: string): *object*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L115)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |
`signer` | string |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *number*

___

###  parseSignatureWithoutPrefix

▸ **parseSignatureWithoutPrefix**(`messageHash`: string, `signature`: string, `signer`: string): *object*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`signature` | string |
`signer` | string |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *number*

___

###  recoverEIP712TypedDataSignerRsv

▸ **recoverEIP712TypedDataSignerRsv**(`typedData`: [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L160)*

Recover signer from RSV-serialized signature over signed typed data.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | RSV signature of signed type data by signer |

**Returns:** *string*

string signer, or throws error if parsing fails

___

###  recoverEIP712TypedDataSignerVrs

▸ **recoverEIP712TypedDataSignerVrs**(`typedData`: [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L173)*

Recover signer from VRS-serialized signature over signed typed data.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | VRS signature of signed type data by signer |

**Returns:** *string*

string signer, or throws error if parsing fails

___

###  signMessage

▸ **signMessage**(`message`: string, `privateKey`: string, `address`: string): *object*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`privateKey` | string |
`address` | string |

**Returns:** *object*

* **r**: *any* = ethjsutil.bufferToHex(r)

* **s**: *any* = ethjsutil.bufferToHex(s)

* **v**: *any*

___

###  signMessageWithoutPrefix

▸ **signMessageWithoutPrefix**(`messageHash`: string, `privateKey`: string, `address`: string): *object*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L88)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`privateKey` | string |
`address` | string |

**Returns:** *object*

* **r**: *any* = ethjsutil.bufferToHex(r)

* **s**: *any* = ethjsutil.bufferToHex(s)

* **v**: *any*

___

###  signedMessageToPublicKey

▸ **signedMessageToPublicKey**(`message`: string, `v`: number, `r`: string, `s`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`v` | number |
`r` | string |
`s` | string |

**Returns:** *string*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md), `signature`: string, `signer`: string): *boolean*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:186](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L186)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | VRS or SRV signature of `typedData` by `signer` |
`signer` | string | address to verify signed the `typedData` |

**Returns:** *boolean*

boolean, true if `signer` is a possible signer of `signature`

___

###  verifySignature

▸ **verifySignature**(`message`: string, `signature`: string, `signer`: string): *boolean*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |
`signer` | string |

**Returns:** *boolean*

## Object literals

### `Const` SignatureUtils

### ▪ **SignatureUtils**: *object*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:250](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L250)*

###  LocalSigner

• **LocalSigner**: *[LocalSigner](_packages_sdk_utils_src_signatureutils_.md#localsigner)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:252](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L252)*

###  NativeSigner

• **NativeSigner**: *NativeSigner*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:251](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L251)*

###  parseSignature

• **parseSignature**: *[parseSignature](_packages_sdk_utils_src_signatureutils_.md#parsesignature)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:255](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L255)*

###  parseSignatureWithoutPrefix

• **parseSignatureWithoutPrefix**: *[parseSignatureWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#parsesignaturewithoutprefix)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:256](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L256)*

###  recoverEIP712TypedDataSignerRsv

• **recoverEIP712TypedDataSignerRsv**: *[recoverEIP712TypedDataSignerRsv](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasignerrsv)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:258](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L258)*

###  recoverEIP712TypedDataSignerVrs

• **recoverEIP712TypedDataSignerVrs**: *[recoverEIP712TypedDataSignerVrs](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasignervrs)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:259](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L259)*

###  serializeSignature

• **serializeSignature**: *serializeSignature*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:257](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L257)*

###  signMessage

• **signMessage**: *[signMessage](_packages_sdk_utils_src_signatureutils_.md#signmessage)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:253](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L253)*

###  signMessageWithoutPrefix

• **signMessageWithoutPrefix**: *[signMessageWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#signmessagewithoutprefix)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:254](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L254)*

###  verifyEIP712TypedDataSigner

• **verifyEIP712TypedDataSigner**: *[verifyEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#verifyeip712typeddatasigner)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:260](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L260)*
