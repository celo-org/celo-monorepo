[@celo/wallet-base](../README.md) › ["signing-utils"](_signing_utils_.md)

# Module: "signing-utils"

## Index

### Variables

* [publicKeyPrefix](_signing_utils_.md#const-publickeyprefix)
* [sixtyFour](_signing_utils_.md#const-sixtyfour)
* [thirtyTwo](_signing_utils_.md#const-thirtytwo)

### Functions

* [chainIdTransformationForSigning](_signing_utils_.md#chainidtransformationforsigning)
* [decodeSig](_signing_utils_.md#decodesig)
* [encodeTransaction](_signing_utils_.md#encodetransaction)
* [extractSignature](_signing_utils_.md#extractsignature)
* [getHashFromEncoded](_signing_utils_.md#gethashfromencoded)
* [recoverMessageSigner](_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_signing_utils_.md#rlpencodedtx)
* [verifyEIP712TypedDataSigner](_signing_utils_.md#verifyeip712typeddatasigner)
* [verifySignatureWithoutPrefix](_signing_utils_.md#verifysignaturewithoutprefix)

## Variables

### `Const` publicKeyPrefix

• **publicKeyPrefix**: *number* = 4

*Defined in [wallets/wallet-base/src/signing-utils.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L18)*

___

### `Const` sixtyFour

• **sixtyFour**: *number* = 64

*Defined in [wallets/wallet-base/src/signing-utils.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L19)*

___

### `Const` thirtyTwo

• **thirtyTwo**: *number* = 32

*Defined in [wallets/wallet-base/src/signing-utils.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L20)*

## Functions

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [wallets/wallet-base/src/signing-utils.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  decodeSig

▸ **decodeSig**(`sig`: any): *object*

*Defined in [wallets/wallet-base/src/signing-utils.ts:238](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L238)*

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

▸ **encodeTransaction**(`rlpEncoded`: RLPEncodedTx, `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [wallets/wallet-base/src/signing-utils.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L121)*

**Parameters:**

▪ **rlpEncoded**: *RLPEncodedTx*

▪ **signature**: *object*

Name | Type |
------ | ------ |
`r` | Buffer |
`s` | Buffer |
`v` | number |

**Returns:** *Promise‹EncodedTransaction›*

___

###  extractSignature

▸ **extractSignature**(`rawTx`: string): *object*

*Defined in [wallets/wallet-base/src/signing-utils.ts:155](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L155)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *object*

* **r**: *Buffer*

* **s**: *Buffer*

* **v**: *number*

___

###  getHashFromEncoded

▸ **getHashFromEncoded**(`rlpEncode`: string): *string*

*Defined in [wallets/wallet-base/src/signing-utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  recoverMessageSigner

▸ **recoverMessageSigner**(`signingDataHex`: string, `signedData`: string): *string*

*Defined in [wallets/wallet-base/src/signing-utils.ts:205](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L205)*

**Parameters:**

Name | Type |
------ | ------ |
`signingDataHex` | string |
`signedData` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[CeloTx, string]*

*Defined in [wallets/wallet-base/src/signing-utils.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L173)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[CeloTx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: CeloTx): *RLPEncodedTx*

*Defined in [wallets/wallet-base/src/signing-utils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *RLPEncodedTx*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: EIP712TypedData, `signedData`: string, `expectedAddress`: string): *boolean*

*Defined in [wallets/wallet-base/src/signing-utils.ts:215](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L215)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |
`signedData` | string |
`expectedAddress` | string |

**Returns:** *boolean*

___

###  verifySignatureWithoutPrefix

▸ **verifySignatureWithoutPrefix**(`messageHash`: string, `signature`: string, `signer`: string): *boolean*

*Defined in [wallets/wallet-base/src/signing-utils.ts:225](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L225)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`signature` | string |
`signer` | string |

**Returns:** *boolean*
