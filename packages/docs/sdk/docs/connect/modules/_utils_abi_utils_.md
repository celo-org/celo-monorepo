[@celo/connect](../README.md) › [Globals](../globals.md) › ["utils/abi-utils"](_utils_abi_utils_.md)

# Module: "utils/abi-utils"

## Index

### Functions

* [decodeStringParameter](_utils_abi_utils_.md#const-decodestringparameter)
* [getAbiByName](_utils_abi_utils_.md#const-getabibyname)
* [parseDecodedParams](_utils_abi_utils_.md#const-parsedecodedparams)

## Functions

### `Const` decodeStringParameter

▸ **decodeStringParameter**(`ethAbi`: [AbiCoder](../interfaces/_abi_types_.abicoder.md), `str`: string): *any*

*Defined in [utils/abi-utils.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L25)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`ethAbi` | [AbiCoder](../interfaces/_abi_types_.abicoder.md) |
`str` | string |

**Returns:** *any*

___

### `Const` getAbiByName

▸ **getAbiByName**(`abi`: [AbiItem](../interfaces/_abi_types_.abiitem.md)[], `methodName`: string): *[AbiItem](../interfaces/_abi_types_.abiitem.md)*

*Defined in [utils/abi-utils.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L5)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`abi` | [AbiItem](../interfaces/_abi_types_.abiitem.md)[] |
`methodName` | string |

**Returns:** *[AbiItem](../interfaces/_abi_types_.abiitem.md)*

___

### `Const` parseDecodedParams

▸ **parseDecodedParams**(`params`: [DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md)): *object*

*Defined in [utils/abi-utils.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L9)*

**`internal`** 

**Parameters:**

Name | Type |
------ | ------ |
`params` | [DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md) |

**Returns:** *object*

* **args**: *any[]*

* **params**: *[DecodedParamsObject](../interfaces/_abi_types_.decodedparamsobject.md)*
