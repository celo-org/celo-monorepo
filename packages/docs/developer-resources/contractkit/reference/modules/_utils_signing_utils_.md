# External module: "utils/signing-utils"

## Index

### Interfaces

* [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)

### Functions

* [bigNumberToBuffer](_utils_signing_utils_.md#bignumbertobuffer)
* [bufferToBigNumber](_utils_signing_utils_.md#buffertobignumber)
* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [recoverMessageSigner](_utils_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_utils_signing_utils_.md#verifyeip712typeddatasigner)

## Functions

###  bigNumberToBuffer

▸ **bigNumberToBuffer**(`input`: BigNumber, `lengthInBytes`: number): *Buffer*

*Defined in [contractkit/src/utils/signing-utils.ts:213](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L213)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber |
`lengthInBytes` | number |

**Returns:** *Buffer*

___

###  bufferToBigNumber

▸ **bufferToBigNumber**(`input`: Buffer): *BigNumber*

*Defined in [contractkit/src/utils/signing-utils.ts:210](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L210)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *BigNumber*

___

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [contractkit/src/utils/signing-utils.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  encodeTransaction

▸ **encodeTransaction**(`rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md), `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/signing-utils.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L121)*

**Parameters:**

▪ **rlpEncoded**: *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

▪ **signature**: *object*

Name | Type |
------ | ------ |
`r` | Buffer |
`s` | Buffer |
`v` | number |

**Returns:** *Promise‹EncodedTransaction›*

___

###  getHashFromEncoded

▸ **getHashFromEncoded**(`rlpEncode`: string): *string*

*Defined in [contractkit/src/utils/signing-utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  recoverMessageSigner

▸ **recoverMessageSigner**(`signingDataHex`: string, `signedData`: string): *string*

*Defined in [contractkit/src/utils/signing-utils.ts:189](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L189)*

**Parameters:**

Name | Type |
------ | ------ |
`signingDataHex` | string |
`signedData` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [contractkit/src/utils/signing-utils.ts:157](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L157)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: Tx): *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

*Defined in [contractkit/src/utils/signing-utils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md), `signedData`: string, `expectedAddress`: string): *boolean*

*Defined in [contractkit/src/utils/signing-utils.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L199)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_utils_sign_typed_data_utils_.eip712typeddata.md) |
`signedData` | string |
`expectedAddress` | string |

**Returns:** *boolean*
