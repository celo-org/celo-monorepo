# utils/abi-utils

## Index

### Functions

* [decodeStringParameter](_utils_abi_utils_.md#const-decodestringparameter)
* [getAbiTypes](_utils_abi_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_abi_utils_.md#const-parsedecodedparams)

## Functions

### `Const` decodeStringParameter

▸ **decodeStringParameter**\(`ethAbi`: [AbiCoder](), `str`: string\): _any_

_Defined in_ [_packages/sdk/connect/src/utils/abi-utils.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ethAbi` | [AbiCoder]() |
| `str` | string |

**Returns:** _any_

### `Const` getAbiTypes

▸ **getAbiTypes**\(`abi`: AbiItem\[\], `methodName`: string\): _string\[\]_

_Defined in_ [_packages/sdk/connect/src/utils/abi-utils.ts:4_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L4)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `abi` | AbiItem\[\] |
| `methodName` | string |

**Returns:** _string\[\]_

### `Const` parseDecodedParams

▸ **parseDecodedParams**\(`params`: [DecodedParamsObject]()\): _object_

_Defined in_ [_packages/sdk/connect/src/utils/abi-utils.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/utils/abi-utils.ts#L7)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params` | [DecodedParamsObject]() |

**Returns:** _object_

* **args**: _any\[\]_
* **params**: [_DecodedParamsObject_]()

