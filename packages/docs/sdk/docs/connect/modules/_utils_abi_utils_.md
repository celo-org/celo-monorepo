[@celo/connect](../README.md) › ["utils/abi-utils"](_utils_abi_utils_.md)

# Module: "utils/abi-utils"

## Index

### Functions

* [decodeStringParameter](_utils_abi_utils_.md#const-decodestringparameter)
* [getAbiByName](_utils_abi_utils_.md#const-getabibyname)
* [parseDecodedParams](_utils_abi_utils_.md#const-parsedecodedparams)

## Functions

### `Const` decodeStringParameter

▸ **decodeStringParameter**(`ethAbi`: [AbiCoder](../interfaces/_abi_types_.abicoder.md), `str`: string): *any*

*Defined in [packages/sdk/connect/src/utils/abi-utils.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`ethAbi` | [AbiCoder](../interfaces/_abi_types_.abicoder.md) |
`str` | string |

**Returns:** *any*

___

### `Const` getAbiByName

▸ **getAbiByName**(`abi`: AbiItem[], `methodName`: string): *AbiItem*

*Defined in [packages/sdk/connect/src/utils/abi-utils.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`abi` | AbiItem[] |
`methodName` | string |

**Returns:** *AbiItem*

___

### `Const` parseDecodedParams

▸ **parseDecodedParams**(`params`: [DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md)): *object*

*Defined in [packages/sdk/connect/src/utils/abi-utils.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | [DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md) |

**Returns:** *object*

* **args**: *any[]*

* **params**: *[DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md)*
