# Module: "utils/abi-utils"

## Index

### Functions

* [decodeStringParameter](_utils_abi_utils_.md#const-decodestringparameter)
* [getAbiTypes](_utils_abi_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_abi_utils_.md#const-parsedecodedparams)

## Functions

### `Const` decodeStringParameter

▸ **decodeStringParameter**(`ethAbi`: [AbiCoder](../interfaces/_abi_types_.abicoder.md), `str`: string): *any*

*Defined in [packages/sdk/connect/src/utils/abi-utils.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`ethAbi` | [AbiCoder](../interfaces/_abi_types_.abicoder.md) |
`str` | string |

**Returns:** *any*

___

### `Const` getAbiTypes

▸ **getAbiTypes**(`abi`: AbiItem[], `methodName`: string): *string[]*

*Defined in [packages/sdk/connect/src/utils/abi-utils.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`abi` | AbiItem[] |
`methodName` | string |

**Returns:** *string[]*

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
