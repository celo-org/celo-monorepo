# External module: "utils/signing-utils"

## Index

### Interfaces

* [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)

### Variables

* [publicKeyPrefix](_utils_signing_utils_.md#const-publickeyprefix)
* [sixtyFour](_utils_signing_utils_.md#const-sixtyfour)
* [thirtyTwo](_utils_signing_utils_.md#const-thirtytwo)

### Functions

* [chainIdTransformationForSigning](_utils_signing_utils_.md#chainidtransformationforsigning)
* [decodeSig](_utils_signing_utils_.md#decodesig)
* [encodeTransaction](_utils_signing_utils_.md#encodetransaction)
* [getAddressFromPublicKey](_utils_signing_utils_.md#getaddressfrompublickey)
* [getHashFromEncoded](_utils_signing_utils_.md#gethashfromencoded)
* [recoverKeyIndex](_utils_signing_utils_.md#recoverkeyindex)
* [recoverMessageSigner](_utils_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_utils_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_utils_signing_utils_.md#verifyeip712typeddatasigner)

## Variables

### `Const` publicKeyPrefix

• **publicKeyPrefix**: *number* = 4

*Defined in [contractkit/src/utils/signing-utils.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L21)*

___

### `Const` sixtyFour

• **sixtyFour**: *number* = 64

*Defined in [contractkit/src/utils/signing-utils.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L22)*

___

### `Const` thirtyTwo

• **thirtyTwo**: *number* = 32

*Defined in [contractkit/src/utils/signing-utils.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L23)*

## Functions

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [contractkit/src/utils/signing-utils.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  decodeSig

▸ **decodeSig**(`sig`: any): *object*

*Defined in [contractkit/src/utils/signing-utils.ts:217](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L217)*

**Parameters:**

Name | Type |
------ | ------ |
`sig` | any |

**Returns:** *object*

* **r**: *Buffer‹›* = ethUtil.toBuffer(r) as Buffer

* **s**: *Buffer‹›* = ethUtil.toBuffer(s) as Buffer

* **v**: *number* = parseInt(v, 16)

___

###  encodeTransaction

▸ **encodeTransaction**(`rlpEncoded`: [RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md), `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/signing-utils.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L129)*

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

###  getAddressFromPublicKey

▸ **getAddressFromPublicKey**(`publicKey`: BigNumber): *[Address](_base_.md#address)*

*Defined in [contractkit/src/utils/signing-utils.ts:250](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L250)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | BigNumber |

**Returns:** *[Address](_base_.md#address)*

___

###  getHashFromEncoded

▸ **getHashFromEncoded**(`rlpEncode`: string): *string*

*Defined in [contractkit/src/utils/signing-utils.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  recoverKeyIndex

▸ **recoverKeyIndex**(`signature`: Uint8Array, `publicKey`: BigNumber, `hash`: Uint8Array): *number*

*Defined in [contractkit/src/utils/signing-utils.ts:229](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L229)*

Attempts each recovery key to find a match

**Parameters:**

Name | Type |
------ | ------ |
`signature` | Uint8Array |
`publicKey` | BigNumber |
`hash` | Uint8Array |

**Returns:** *number*

___

###  recoverMessageSigner

▸ **recoverMessageSigner**(`signingDataHex`: string, `signedData`: string): *string*

*Defined in [contractkit/src/utils/signing-utils.ts:196](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L196)*

**Parameters:**

Name | Type |
------ | ------ |
`signingDataHex` | string |
`signedData` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [contractkit/src/utils/signing-utils.ts:164](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L164)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: Tx): *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

*Defined in [contractkit/src/utils/signing-utils.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *[RLPEncodedTx](../interfaces/_utils_signing_utils_.rlpencodedtx.md)*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: EIP712TypedData, `signedData`: string, `expectedAddress`: string): *boolean*

*Defined in [contractkit/src/utils/signing-utils.ts:206](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L206)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |
`signedData` | string |
`expectedAddress` | string |

**Returns:** *boolean*
