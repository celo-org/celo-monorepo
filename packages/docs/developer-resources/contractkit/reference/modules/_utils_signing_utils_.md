# External module: "utils/signing-utils"

## Index

### Interfaces

* [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)

### Functions

* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [signEncodedTransaction](_utils_signing_utils_.md#signencodedtransaction)
* [signTransaction](_utils_signing_utils_.md#signtransaction)
* [signatureFormatter](_utils_signing_utils_.md#signatureformatter)

## Functions

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [src/utils/signing-utils.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  encodeTransaction

▸ **encodeTransaction**(`rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md), `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [src/utils/signing-utils.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L135)*

**Parameters:**

▪ **rlpEncoded**: *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

▪ **signature**: *object*

Name | Type |
------ | ------ |
`r` | string |
`s` | string |
`v` | string |

**Returns:** *Promise‹EncodedTransaction›*

___

###  getHashFromEncoded

▸ **getHashFromEncoded**(`rlpEncode`: string): *string*

*Defined in [src/utils/signing-utils.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [src/utils/signing-utils.ts:178](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L178)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: Tx): *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

*Defined in [src/utils/signing-utils.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

___

###  signEncodedTransaction

▸ **signEncodedTransaction**(`privateKey`: string, `rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *object*

*Defined in [src/utils/signing-utils.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`rlpEncoded` | [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md) |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *string*

___

###  signTransaction

▸ **signTransaction**(`tx`: Tx, `privateKey`: string): *Promise‹EncodedTransaction›*

*Defined in [src/utils/signing-utils.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |
`privateKey` | string |

**Returns:** *Promise‹EncodedTransaction›*

___

###  signatureFormatter

▸ **signatureFormatter**(`signature`: object): *object*

*Defined in [src/utils/signing-utils.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L123)*

**Parameters:**

▪ **signature**: *object*

Name | Type |
------ | ------ |
`r` | string |
`s` | string |
`v` | string |

**Returns:** *object*

* **r**: *string*

* **s**: *string*

* **v**: *string*
