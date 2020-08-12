# External module: "contractkit/src/utils/signing-utils"

## Index

### Interfaces

* [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)

### Variables

* [publicKeyPrefix](_contractkit_src_utils_signing_utils_.md#const-publickeyprefix)
* [sixtyFour](_contractkit_src_utils_signing_utils_.md#const-sixtyfour)
* [thirtyTwo](_contractkit_src_utils_signing_utils_.md#const-thirtytwo)

### Functions

* [chainIdTransformationForSigning](_contractkit_src_utils_signing_utils_.md#chainidtransformationforsigning)
* [decodeSig](_contractkit_src_utils_signing_utils_.md#decodesig)
* [encodeTransaction](_contractkit_src_utils_signing_utils_.md#encodetransaction)
* [getAddressFromPublicKey](_contractkit_src_utils_signing_utils_.md#getaddressfrompublickey)
* [getHashFromEncoded](_contractkit_src_utils_signing_utils_.md#gethashfromencoded)
* [recoverKeyIndex](_contractkit_src_utils_signing_utils_.md#recoverkeyindex)
* [recoverMessageSigner](_contractkit_src_utils_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_contractkit_src_utils_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_contractkit_src_utils_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_contractkit_src_utils_signing_utils_.md#verifyeip712typeddatasigner)

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

*Defined in [contractkit/src/utils/signing-utils.ts:218](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L218)*

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

▸ **encodeTransaction**(`rlpEncoded`: [RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md), `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [contractkit/src/utils/signing-utils.ts:129](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L129)*

**Parameters:**

▪ **rlpEncoded**: *[RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)*

▪ **signature**: *object*

Name | Type |
------ | ------ |
`r` | Buffer |
`s` | Buffer |
`v` | number |

**Returns:** *Promise‹EncodedTransaction›*

___

###  getAddressFromPublicKey

▸ **getAddressFromPublicKey**(`publicKey`: BigNumber): *[Address](_contractkit_src_base_.md#address)*

*Defined in [contractkit/src/utils/signing-utils.ts:256](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L256)*

Maps the publicKey to its address

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | BigNumber |

**Returns:** *[Address](_contractkit_src_base_.md#address)*

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

*Defined in [contractkit/src/utils/signing-utils.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L230)*

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

*Defined in [contractkit/src/utils/signing-utils.ts:197](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L197)*

**Parameters:**

Name | Type |
------ | ------ |
`signingDataHex` | string |
`signedData` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[Tx, string]*

*Defined in [contractkit/src/utils/signing-utils.ts:165](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[Tx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: Tx): *[RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)*

*Defined in [contractkit/src/utils/signing-utils.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *[RLPEncodedTx](../interfaces/_contractkit_src_utils_signing_utils_.rlpencodedtx.md)*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md), `signedData`: string, `expectedAddress`: string): *boolean*

*Defined in [contractkit/src/utils/signing-utils.ts:207](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signing-utils.ts#L207)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md) |
`signedData` | string |
`expectedAddress` | string |

**Returns:** *boolean*
