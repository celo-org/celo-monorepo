# External module: "contractkit/src/utils/signature-utils"

## Index

### Classes

* [Signature](../classes/_contractkit_src_utils_signature_utils_.signature.md)

### Functions

* [bigNumberToBuffer](_contractkit_src_utils_signature_utils_.md#const-bignumbertobuffer)
* [bufferToBigNumber](_contractkit_src_utils_signature_utils_.md#const-buffertobignumber)
* [isCanonical](_contractkit_src_utils_signature_utils_.md#const-iscanonical)

## Functions

### `Const` bigNumberToBuffer

▸ **bigNumberToBuffer**(`input`: BigNumber, `lengthInBytes`: number): *Buffer*

*Defined in [contractkit/src/utils/signature-utils.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber |
`lengthInBytes` | number |

**Returns:** *Buffer*

___

### `Const` bufferToBigNumber

▸ **bufferToBigNumber**(`input`: Buffer): *BigNumber*

*Defined in [contractkit/src/utils/signature-utils.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *BigNumber*

___

### `Const` isCanonical

▸ **isCanonical**(`S`: BigNumber, `curveN`: BigNumber): *boolean*

*Defined in [contractkit/src/utils/signature-utils.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/signature-utils.ts#L8)*

Returns true if the signature is in the "bottom" of the curve

**Parameters:**

Name | Type |
------ | ------ |
`S` | BigNumber |
`curveN` | BigNumber |

**Returns:** *boolean*
