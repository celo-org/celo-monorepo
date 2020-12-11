# utils/signature-utils

## Index

### Classes

* [Signature]()

### Functions

* [bigNumberToBuffer](_utils_signature_utils_.md#const-bignumbertobuffer)
* [bufferToBigNumber](_utils_signature_utils_.md#const-buffertobignumber)
* [makeCanonical](_utils_signature_utils_.md#const-makecanonical)

## Functions

### `Const` bigNumberToBuffer

▸ **bigNumberToBuffer**\(`input`: BigNumber, `lengthInBytes`: number\): _Buffer_

_Defined in_ [_packages/contractkit/src/utils/signature-utils.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber |
| `lengthInBytes` | number |

**Returns:** _Buffer_

### `Const` bufferToBigNumber

▸ **bufferToBigNumber**\(`input`: Buffer\): _BigNumber_

_Defined in_ [_packages/contractkit/src/utils/signature-utils.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | Buffer |

**Returns:** _BigNumber_

### `Const` makeCanonical

▸ **makeCanonical**\(`S`: BigNumber\): _BigNumber_

_Defined in_ [_packages/contractkit/src/utils/signature-utils.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L14)

If the signature is in the "bottom" of the curve, it is non-canonical Non-canonical signatures are illegal in Ethereum and therefore the S value must be transposed to the lower intersection [https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki\#Low\_S\_values\_in\_signatures](https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `S` | BigNumber |

**Returns:** _BigNumber_

