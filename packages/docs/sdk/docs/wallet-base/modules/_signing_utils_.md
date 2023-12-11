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
* [getSignerFromTxEIP2718TX](_signing_utils_.md#getsignerfromtxeip2718tx)
* [isPriceToLow](_signing_utils_.md#ispricetolow)
* [recoverMessageSigner](_signing_utils_.md#recovermessagesigner)
* [recoverTransaction](_signing_utils_.md#recovertransaction)
* [rlpEncodedTx](_signing_utils_.md#rlpencodedtx)
* [stringNumberOrBNToHex](_signing_utils_.md#stringnumberorbntohex)
* [verifyEIP712TypedDataSigner](_signing_utils_.md#verifyeip712typeddatasigner)
* [verifySignatureWithoutPrefix](_signing_utils_.md#verifysignaturewithoutprefix)

## Variables

### `Const` publicKeyPrefix

• **publicKeyPrefix**: *number* = 4

*Defined in [wallets/wallet-base/src/signing-utils.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L45)*

___

### `Const` sixtyFour

• **sixtyFour**: *number* = 64

*Defined in [wallets/wallet-base/src/signing-utils.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L46)*

___

### `Const` thirtyTwo

• **thirtyTwo**: *number* = 32

*Defined in [wallets/wallet-base/src/signing-utils.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L47)*

## Functions

###  chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**(`chainId`: number): *number*

*Defined in [wallets/wallet-base/src/signing-utils.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`chainId` | number |

**Returns:** *number*

___

###  decodeSig

▸ **decodeSig**(`sig`: any): *[decodeSig](_signing_utils_.md#decodesig)*

*Defined in [wallets/wallet-base/src/signing-utils.ts:698](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L698)*

**Parameters:**

Name | Type |
------ | ------ |
`sig` | any |

**Returns:** *[decodeSig](_signing_utils_.md#decodesig)*

___

###  encodeTransaction

▸ **encodeTransaction**(`rlpEncoded`: RLPEncodedTx, `signature`: object): *Promise‹EncodedTransaction›*

*Defined in [wallets/wallet-base/src/signing-utils.ts:323](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L323)*

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

▸ **extractSignature**(`rawTx`: string): *[extractSignature](_signing_utils_.md#extractsignature)*

*Defined in [wallets/wallet-base/src/signing-utils.ts:406](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L406)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[extractSignature](_signing_utils_.md#extractsignature)*

___

###  getHashFromEncoded

▸ **getHashFromEncoded**(`rlpEncode`: string): *string*

*Defined in [wallets/wallet-base/src/signing-utils.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`rlpEncode` | string |

**Returns:** *string*

___

###  getSignerFromTxEIP2718TX

▸ **getSignerFromTxEIP2718TX**(`serializedTransaction`: string): *string*

*Defined in [wallets/wallet-base/src/signing-utils.ts:501](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L501)*

**Parameters:**

Name | Type |
------ | ------ |
`serializedTransaction` | string |

**Returns:** *string*

___

###  isPriceToLow

▸ **isPriceToLow**(`tx`: CeloTx): *[isPriceToLow](_signing_utils_.md#ispricetolow)*

*Defined in [wallets/wallet-base/src/signing-utils.ts:272](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L272)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *[isPriceToLow](_signing_utils_.md#ispricetolow)*

___

###  recoverMessageSigner

▸ **recoverMessageSigner**(`signingDataHex`: string, `signedData`: string): *string*

*Defined in [wallets/wallet-base/src/signing-utils.ts:666](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L666)*

**Parameters:**

Name | Type |
------ | ------ |
`signingDataHex` | string |
`signedData` | string |

**Returns:** *string*

___

###  recoverTransaction

▸ **recoverTransaction**(`rawTx`: string): *[CeloTx, string]*

*Defined in [wallets/wallet-base/src/signing-utils.ts:440](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L440)*

**Parameters:**

Name | Type |
------ | ------ |
`rawTx` | string |

**Returns:** *[CeloTx, string]*

___

###  rlpEncodedTx

▸ **rlpEncodedTx**(`tx`: CeloTx): *RLPEncodedTx*

*Defined in [wallets/wallet-base/src/signing-utils.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTx |

**Returns:** *RLPEncodedTx*

___

###  stringNumberOrBNToHex

▸ **stringNumberOrBNToHex**(`num?`: number | string | ReturnType‹Web3["utils"]["toBN"]›): *Hex*

*Defined in [wallets/wallet-base/src/signing-utils.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L98)*

**Parameters:**

Name | Type |
------ | ------ |
`num?` | number &#124; string &#124; ReturnType‹Web3["utils"]["toBN"]› |

**Returns:** *Hex*

___

###  verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**(`typedData`: EIP712TypedData, `signedData`: string, `expectedAddress`: string): *boolean*

*Defined in [wallets/wallet-base/src/signing-utils.ts:676](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L676)*

**Parameters:**

Name | Type |
------ | ------ |
`typedData` | EIP712TypedData |
`signedData` | string |
`expectedAddress` | string |

**Returns:** *boolean*

___

###  verifySignatureWithoutPrefix

▸ **verifySignatureWithoutPrefix**(`messageHash`: string, `signature`: string, `signer`: string): *[verifySignatureWithoutPrefix](_signing_utils_.md#verifysignaturewithoutprefix)*

*Defined in [wallets/wallet-base/src/signing-utils.ts:685](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L685)*

**Parameters:**

Name | Type |
------ | ------ |
`messageHash` | string |
`signature` | string |
`signer` | string |

**Returns:** *[verifySignatureWithoutPrefix](_signing_utils_.md#verifysignaturewithoutprefix)*
