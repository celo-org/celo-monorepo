# signing-utils

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

• **publicKeyPrefix**: _number_ = 4

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L18)

### `Const` sixtyFour

• **sixtyFour**: _number_ = 64

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L19)

### `Const` thirtyTwo

• **thirtyTwo**: _number_ = 32

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L20)

## Functions

### chainIdTransformationForSigning

▸ **chainIdTransformationForSigning**\(`chainId`: number\): _number_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `chainId` | number |

**Returns:** _number_

### decodeSig

▸ **decodeSig**\(`sig`: any\): _object_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:240_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L240)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sig` | any |

**Returns:** _object_

* **r**: _Buffer‹›_ = ethUtil.toBuffer\(r\) as Buffer
* **s**: _Buffer‹›_ = ethUtil.toBuffer\(s\) as Buffer
* **v**: _number_ = parseInt\(v, 16\)

### encodeTransaction

▸ **encodeTransaction**\(`rlpEncoded`: RLPEncodedTx, `signature`: object\): _Promise‹EncodedTransaction›_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L121)

**Parameters:**

▪ **rlpEncoded**: _RLPEncodedTx_

▪ **signature**: _object_

| Name | Type |
| :--- | :--- |
| `r` | Buffer |
| `s` | Buffer |
| `v` | number |

**Returns:** _Promise‹EncodedTransaction›_

### extractSignature

▸ **extractSignature**\(`rawTx`: string\): _object_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:157_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L157)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTx` | string |

**Returns:** _object_

* **r**: _Buffer_
* **s**: _Buffer_
* **v**: _number_

### getHashFromEncoded

▸ **getHashFromEncoded**\(`rlpEncode`: string\): _string_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L32)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rlpEncode` | string |

**Returns:** _string_

### recoverMessageSigner

▸ **recoverMessageSigner**\(`signingDataHex`: string, `signedData`: string\): _string_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:207_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L207)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signingDataHex` | string |
| `signedData` | string |

**Returns:** _string_

### recoverTransaction

▸ **recoverTransaction**\(`rawTx`: string\): _\[CeloTx, string\]_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:175_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L175)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `rawTx` | string |

**Returns:** _\[CeloTx, string\]_

### rlpEncodedTx

▸ **rlpEncodedTx**\(`tx`: CeloTx\): _RLPEncodedTx_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTx |

**Returns:** _RLPEncodedTx_

### verifyEIP712TypedDataSigner

▸ **verifyEIP712TypedDataSigner**\(`typedData`: EIP712TypedData, `signedData`: string, `expectedAddress`: string\): _boolean_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:217_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L217)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `typedData` | EIP712TypedData |
| `signedData` | string |
| `expectedAddress` | string |

**Returns:** _boolean_

### verifySignatureWithoutPrefix

▸ **verifySignatureWithoutPrefix**\(`messageHash`: string, `signature`: string, `signer`: string\): _boolean_

_Defined in_ [_wallets/wallet-base/src/signing-utils.ts:227_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-base/src/signing-utils.ts#L227)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `messageHash` | string |
| `signature` | string |
| `signer` | string |

**Returns:** _boolean_

