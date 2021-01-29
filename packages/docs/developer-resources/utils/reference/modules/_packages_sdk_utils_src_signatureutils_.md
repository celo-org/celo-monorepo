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
* [recoverEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasigner)
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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L166)*

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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L111)*

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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L115)*

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

###  recoverEIP712TypedDataSigner

▸ **recoverEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md) |
`signature` | string |

**Returns:** *string*

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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L84)*

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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L157)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_packages_sdk_utils_src_sign_typed_data_utils_.eip712typeddata.md) |
`signature` | string |
`signer` | string |

**Returns:** *boolean*

___

###  verifySignature

▸ **verifySignature**(`message`: string, `signature`: string, `signer`: string): *boolean*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L102)*

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

*Defined in [packages/sdk/utils/src/signatureUtils.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L213)*

###  LocalSigner

• **LocalSigner**: *[LocalSigner](_packages_sdk_utils_src_signatureutils_.md#localsigner)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L215)*

###  NativeSigner

• **NativeSigner**: *NativeSigner*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:214](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L214)*

###  parseSignature

• **parseSignature**: *[parseSignature](_packages_sdk_utils_src_signatureutils_.md#parsesignature)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L218)*

###  parseSignatureWithoutPrefix

• **parseSignatureWithoutPrefix**: *[parseSignatureWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#parsesignaturewithoutprefix)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:219](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L219)*

###  recoverEIP712TypedDataSigner

• **recoverEIP712TypedDataSigner**: *[recoverEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#recovereip712typeddatasigner)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:221](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L221)*

###  serializeSignature

• **serializeSignature**: *serializeSignature*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:220](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L220)*

###  signMessage

• **signMessage**: *[signMessage](_packages_sdk_utils_src_signatureutils_.md#signmessage)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:216](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L216)*

###  signMessageWithoutPrefix

• **signMessageWithoutPrefix**: *[signMessageWithoutPrefix](_packages_sdk_utils_src_signatureutils_.md#signmessagewithoutprefix)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L217)*

###  verifyEIP712TypedDataSigner

• **verifyEIP712TypedDataSigner**: *[verifyEIP712TypedDataSigner](_packages_sdk_utils_src_signatureutils_.md#verifyeip712typeddatasigner)*

*Defined in [packages/sdk/utils/src/signatureUtils.ts:222](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L222)*
