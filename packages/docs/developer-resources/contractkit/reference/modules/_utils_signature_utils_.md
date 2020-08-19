# External module: "utils/signature-utils"

## Index

### Classes

* [Signature](../classes/_utils_signature_utils_.signature.md)

### Functions

* [bigNumberToBuffer](_utils_signature_utils_.md#const-bignumbertobuffer)
* [bufferToBigNumber](_utils_signature_utils_.md#const-buffertobignumber)
* [makeCanonical](_utils_signature_utils_.md#const-makecanonical)

## Functions

### `Const` bigNumberToBuffer

▸ **bigNumberToBuffer**(`input`: BigNumber, `lengthInBytes`: number): *Buffer*

*Defined in [packages/contractkit/src/utils/signature-utils.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber |
`lengthInBytes` | number |

**Returns:** *Buffer*

___

### `Const` bufferToBigNumber

▸ **bufferToBigNumber**(`input`: Buffer): *BigNumber*

*Defined in [packages/contractkit/src/utils/signature-utils.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *BigNumber*

___

### `Const` makeCanonical

▸ **makeCanonical**(`S`: BigNumber): *BigNumber*

*Defined in [packages/contractkit/src/utils/signature-utils.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L14)*

If the signature is in the "bottom" of the curve, it is non-canonical
Non-canonical signatures are illegal in Ethereum and therefore the S value
must be transposed to the lower intersection
https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures

**Parameters:**

Name | Type |
------ | ------ |
`S` | BigNumber |

**Returns:** *BigNumber*
