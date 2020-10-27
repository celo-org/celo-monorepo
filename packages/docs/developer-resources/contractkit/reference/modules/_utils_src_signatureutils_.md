# External module: "utils/src/signatureUtils"

## Index

### References

* [NativeSigner](_utils_src_signatureutils_.md#nativesigner)
* [POP_SIZE](_utils_src_signatureutils_.md#pop_size)
* [Signature](_utils_src_signatureutils_.md#signature)
* [Signer](_utils_src_signatureutils_.md#signer)
* [serializeSignature](_utils_src_signatureutils_.md#serializesignature)

### Functions

* [LocalSigner](_utils_src_signatureutils_.md#localsigner)
* [addressToPublicKey](_utils_src_signatureutils_.md#addresstopublickey)
* [guessSigner](_utils_src_signatureutils_.md#guesssigner)
* [hashMessage](_utils_src_signatureutils_.md#hashmessage)
* [hashMessageWithPrefix](_utils_src_signatureutils_.md#hashmessagewithprefix)
* [parseSignature](_utils_src_signatureutils_.md#parsesignature)
* [parseSignatureWithoutPrefix](_utils_src_signatureutils_.md#parsesignaturewithoutprefix)
* [recoverEIP712TypedDataSigner](_utils_src_signatureutils_.md#recovereip712typeddatasigner)
* [signMessage](_utils_src_signatureutils_.md#signmessage)
* [signMessageWithoutPrefix](_utils_src_signatureutils_.md#signmessagewithoutprefix)
* [signedMessageToPublicKey](_utils_src_signatureutils_.md#signedmessagetopublickey)
* [verifySignature](_utils_src_signatureutils_.md#verifysignature)

### Object literals

* [SignatureUtils](_utils_src_signatureutils_.md#const-signatureutils)

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

*Defined in [packages/utils/src/signatureUtils.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *Signer*

___

###  addressToPublicKey

▸ **addressToPublicKey**(`signer`: string, `signFn`: function): *Promise‹string›*

*Defined in [packages/utils/src/signatureUtils.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L35)*

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

*Defined in [packages/utils/src/signatureUtils.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |

**Returns:** *string*

___

###  hashMessage

▸ **hashMessage**(`message`: string): *string*

*Defined in [packages/utils/src/signatureUtils.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  hashMessageWithPrefix

▸ **hashMessageWithPrefix**(`message`: string): *string*

*Defined in [packages/utils/src/signatureUtils.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  parseSignature

▸ **parseSignature**(`message`: string, `signature`: string, `signer`: string): *object*

*Defined in [packages/utils/src/signatureUtils.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L111)*

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

*Defined in [packages/utils/src/signatureUtils.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L115)*

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

▸ **recoverEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [packages/utils/src/signatureUtils.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md) |
`signature` | string |

**Returns:** *string*

___

###  signMessage

▸ **signMessage**(`message`: string, `privateKey`: string, `address`: string): *object*

*Defined in [packages/utils/src/signatureUtils.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L80)*

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

*Defined in [packages/utils/src/signatureUtils.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L84)*

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

*Defined in [packages/utils/src/signatureUtils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`v` | number |
`r` | string |
`s` | string |

**Returns:** *string*

___

###  verifySignature

▸ **verifySignature**(`message`: string, `signature`: string, `signer`: string): *boolean*

*Defined in [packages/utils/src/signatureUtils.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L102)*

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

*Defined in [packages/utils/src/signatureUtils.ts:195](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L195)*

###  LocalSigner

• **LocalSigner**: *[LocalSigner](_utils_src_signatureutils_.md#localsigner)*

*Defined in [packages/utils/src/signatureUtils.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L197)*

###  NativeSigner

• **NativeSigner**: *NativeSigner*

*Defined in [packages/utils/src/signatureUtils.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L196)*

###  parseSignature

• **parseSignature**: *[parseSignature](_utils_src_signatureutils_.md#parsesignature)*

*Defined in [packages/utils/src/signatureUtils.ts:200](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L200)*

###  parseSignatureWithoutPrefix

• **parseSignatureWithoutPrefix**: *[parseSignatureWithoutPrefix](_utils_src_signatureutils_.md#parsesignaturewithoutprefix)*

*Defined in [packages/utils/src/signatureUtils.ts:201](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L201)*

###  serializeSignature

• **serializeSignature**: *serializeSignature*

*Defined in [packages/utils/src/signatureUtils.ts:202](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L202)*

###  signMessage

• **signMessage**: *[signMessage](_utils_src_signatureutils_.md#signmessage)*

*Defined in [packages/utils/src/signatureUtils.ts:198](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L198)*

###  signMessageWithoutPrefix

• **signMessageWithoutPrefix**: *[signMessageWithoutPrefix](_utils_src_signatureutils_.md#signmessagewithoutprefix)*

*Defined in [packages/utils/src/signatureUtils.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/signatureUtils.ts#L199)*
