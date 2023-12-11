[@celo/utils](../README.md) › ["signatureUtils"](_signatureutils_.md)

# Module: "signatureUtils"

## Index

### References

* [NativeSigner](_signatureutils_.md#nativesigner)
* [POP_SIZE](_signatureutils_.md#pop_size)
* [Signature](_signatureutils_.md#signature)
* [Signer](_signatureutils_.md#signer)
* [serializeSignature](_signatureutils_.md#serializesignature)

### Functions

* [LocalSigner](_signatureutils_.md#localsigner)
* [addressToPublicKey](_signatureutils_.md#addresstopublickey)
* [guessSigner](_signatureutils_.md#guesssigner)
* [hashMessage](_signatureutils_.md#hashmessage)
* [hashMessageWithPrefix](_signatureutils_.md#hashmessagewithprefix)
* [parseSignature](_signatureutils_.md#parsesignature)
* [parseSignatureWithoutPrefix](_signatureutils_.md#parsesignaturewithoutprefix)
* [recoverEIP712TypedDataSignerRsv](_signatureutils_.md#recovereip712typeddatasignerrsv)
* [recoverEIP712TypedDataSignerVrs](_signatureutils_.md#recovereip712typeddatasignervrs)
* [signMessage](_signatureutils_.md#signmessage)
* [signMessageWithoutPrefix](_signatureutils_.md#signmessagewithoutprefix)
* [signedMessageToPublicKey](_signatureutils_.md#signedmessagetopublickey)
* [verifyEIP712TypedDataSigner](_signatureutils_.md#verifyeip712typeddatasigner)
* [verifySignature](_signatureutils_.md#verifysignature)

### Object literals

* [SignatureUtils](_signatureutils_.md#const-signatureutils)

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

*Defined in [signatureUtils.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |

**Returns:** *Signer*

___

###  addressToPublicKey

▸ **addressToPublicKey**(`signer`: string, `signFn`: function): *[addressToPublicKey](_signatureutils_.md#addresstopublickey)*

*Defined in [signatureUtils.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L43)*

**Parameters:**

▪ **signer**: *string*

▪ **signFn**: *function*

▸ (`message`: string, `signer`: string): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signer` | string |

**Returns:** *[addressToPublicKey](_signatureutils_.md#addresstopublickey)*

___

###  guessSigner

▸ **guessSigner**(`message`: string, `signature`: string): *string*

*Defined in [signatureUtils.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L196)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |

**Returns:** *string*

___

###  hashMessage

▸ **hashMessage**(`message`: string): *string*

*Defined in [signatureUtils.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  hashMessageWithPrefix

▸ **hashMessageWithPrefix**(`message`: string): *string*

*Defined in [signatureUtils.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *string*

___

###  parseSignature

▸ **parseSignature**(`message`: string, `signature`: string, `signer`: string): *[parseSignature](_signatureutils_.md#parsesignature)*

*Defined in [signatureUtils.ts:113](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L113)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |
`signer` | string |

**Returns:** *[parseSignature](_signatureutils_.md#parsesignature)*

___

###  parseSignatureWithoutPrefix

▸ **parseSignatureWithoutPrefix**(`messageHash`: string, `signature`: string, `signer`: string): *[parseSignatureWithoutPrefix](_signatureutils_.md#parsesignaturewithoutprefix)*

*Defined in [signatureUtils.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`signature` | string |
`signer` | string |

**Returns:** *[parseSignatureWithoutPrefix](_signatureutils_.md#parsesignaturewithoutprefix)*

___

###  recoverEIP712TypedDataSignerRsv

▸ **recoverEIP712TypedDataSignerRsv**(`typedData`: [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [signatureUtils.ts:153](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L153)*

Recover signer from RSV-serialized signature over signed typed data.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | RSV signature of signed type data by signer |

**Returns:** *string*

string signer, or throws error if parsing fails

___

###  recoverEIP712TypedDataSignerVrs

▸ **recoverEIP712TypedDataSignerVrs**(`typedData`: [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md), `signature`: string): *string*

*Defined in [signatureUtils.ts:166](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L166)*

Recover signer from VRS-serialized signature over signed typed data.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | VRS signature of signed type data by signer |

**Returns:** *string*

string signer, or throws error if parsing fails

___

###  signMessage

▸ **signMessage**(`message`: string, `privateKey`: string, `address`: string): *[signMessage](_signatureutils_.md#signmessage)*

*Defined in [signatureUtils.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`privateKey` | string |
`address` | string |

**Returns:** *[signMessage](_signatureutils_.md#signmessage)*

___

###  signMessageWithoutPrefix

▸ **signMessageWithoutPrefix**(`messageHash`: string, `privateKey`: string, `address`: string): *[signMessageWithoutPrefix](_signatureutils_.md#signmessagewithoutprefix)*

*Defined in [signatureUtils.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L91)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`privateKey` | string |
`address` | string |

**Returns:** *[signMessageWithoutPrefix](_signatureutils_.md#signmessagewithoutprefix)*

___

###  signedMessageToPublicKey

▸ **signedMessageToPublicKey**(`message`: string, `v`: number, `r`: string, `s`: string): *[signedMessageToPublicKey](_signatureutils_.md#signedmessagetopublickey)*

*Defined in [signatureUtils.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`v` | number |
`r` | string |
`s` | string |

**Returns:** *[signedMessageToPublicKey](_signatureutils_.md#signedmessagetopublickey)*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md), `signature`: string, `signer`: string): *[verifyEIP712TypedDataSigner](_signatureutils_.md#verifyeip712typeddatasigner)*

*Defined in [signatureUtils.ts:179](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L179)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md) | EIP712 typed data |
`signature` | string | VRS or SRV signature of `typedData` by `signer` |
`signer` | string | address to verify signed the `typedData` |

**Returns:** *[verifyEIP712TypedDataSigner](_signatureutils_.md#verifyeip712typeddatasigner)*

boolean, true if `signer` is a possible signer of `signature`

___

###  verifySignature

▸ **verifySignature**(`message`: string, `signature`: string, `signer`: string): *[verifySignature](_signatureutils_.md#verifysignature)*

*Defined in [signatureUtils.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |
`signature` | string |
`signer` | string |

**Returns:** *[verifySignature](_signatureutils_.md#verifysignature)*

## Object literals

### `Const` SignatureUtils

### ▪ **SignatureUtils**: *object*

*Defined in [signatureUtils.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L235)*

###  LocalSigner

• **LocalSigner**: *[LocalSigner](_signatureutils_.md#localsigner)*

*Defined in [signatureUtils.ts:237](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L237)*

###  NativeSigner

• **NativeSigner**: *NativeSigner*

*Defined in [signatureUtils.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L236)*

###  parseSignature

• **parseSignature**: *[parseSignature](_signatureutils_.md#parsesignature)*

*Defined in [signatureUtils.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L240)*

###  parseSignatureWithoutPrefix

• **parseSignatureWithoutPrefix**: *[parseSignatureWithoutPrefix](_signatureutils_.md#parsesignaturewithoutprefix)*

*Defined in [signatureUtils.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L241)*

###  recoverEIP712TypedDataSignerRsv

• **recoverEIP712TypedDataSignerRsv**: *[recoverEIP712TypedDataSignerRsv](_signatureutils_.md#recovereip712typeddatasignerrsv)*

*Defined in [signatureUtils.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L243)*

###  recoverEIP712TypedDataSignerVrs

• **recoverEIP712TypedDataSignerVrs**: *[recoverEIP712TypedDataSignerVrs](_signatureutils_.md#recovereip712typeddatasignervrs)*

*Defined in [signatureUtils.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L244)*

###  serializeSignature

• **serializeSignature**: *serializeSignature*

*Defined in [signatureUtils.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L242)*

###  signMessage

• **signMessage**: *[signMessage](_signatureutils_.md#signmessage)*

*Defined in [signatureUtils.ts:238](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L238)*

###  signMessageWithoutPrefix

• **signMessageWithoutPrefix**: *[signMessageWithoutPrefix](_signatureutils_.md#signmessagewithoutprefix)*

*Defined in [signatureUtils.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L239)*

###  verifyEIP712TypedDataSigner

• **verifyEIP712TypedDataSigner**: *[verifyEIP712TypedDataSigner](_signatureutils_.md#verifyeip712typeddatasigner)*

*Defined in [signatureUtils.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/signatureUtils.ts#L245)*
