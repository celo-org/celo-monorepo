# utils/web3-utils

## Index

### Functions

* [estimateGas](_utils_web3_utils_.md#const-estimategas)
* [getAbiTypes](_utils_web3_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_web3_utils_.md#const-parsedecodedparams)

## Functions

### `Const` estimateGas

▸ **estimateGas**\(`tx`: Tx, `gasEstimator`: function, `caller`: function\): _Promise‹number›_

_Defined in_ [_packages/contractkit/src/utils/web3-utils.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L23)

**Parameters:**

▪ **tx**: _Tx_

▪ **gasEstimator**: _function_

▸ \(`tx`: Tx\): _Promise‹number›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

▪ **caller**: _function_

▸ \(`tx`: Tx\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Tx |

**Returns:** _Promise‹number›_

### `Const` getAbiTypes

▸ **getAbiTypes**\(`abi`: ABIDefinition\[\], `methodName`: string\): _string\[\]_

_Defined in_ [_packages/contractkit/src/utils/web3-utils.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L7)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `abi` | ABIDefinition\[\] |
| `methodName` | string |

**Returns:** _string\[\]_

### `Const` parseDecodedParams

▸ **parseDecodedParams**\(`params`: DecodedParamsObject\): _object_

_Defined in_ [_packages/contractkit/src/utils/web3-utils.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L10)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `params` | DecodedParamsObject |

**Returns:** _object_

* **args**: _any\[\]_
* **params**: _DecodedParamsObject_

