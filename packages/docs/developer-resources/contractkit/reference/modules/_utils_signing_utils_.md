# External module: "utils/signing-utils"

## Index

### Interfaces

* [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)

### Functions

* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [makeEven](_utils_signing_utils_.md#makeeven)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [signEncodedTransaction](_utils_signing_utils_.md#signencodedtransaction)
* [signTransaction](_utils_signing_utils_.md#signtransaction)

## Functions

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [contractkit/src/utils/signing-utils.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  encodeTransaction

▸ **encodeTransaction**(`rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md), `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/signing-utils.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L125)*

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

*Defined in [contractkit/src/utils/signing-utils.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  makeEven

▸ **makeEven**(`hex`: string): *string*

*Defined in [contractkit/src/utils/signing-utils.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`hex` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [contractkit/src/utils/signing-utils.ts:168](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L168)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: Tx): *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

*Defined in [contractkit/src/utils/signing-utils.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

___

###  signEncodedTransaction

▸ **signEncodedTransaction**(`privateKey`: string, `rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)): *object*

*Defined in [contractkit/src/utils/signing-utils.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L104)*

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

*Defined in [contractkit/src/utils/signing-utils.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |
`privateKey` | string |

**Returns:** *Promise‹EncodedTransaction›*
