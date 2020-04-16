# External module: "utils/web3-utils"

## Index

### Functions

* [estimateGas](_utils_web3_utils_.md#const-estimategas)
* [getAbiTypes](_utils_web3_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_web3_utils_.md#const-parsedecodedparams)
* [traceBlock](_utils_web3_utils_.md#traceblock)
* [traceTransaction](_utils_web3_utils_.md#tracetransaction)

## Functions

### `Const` estimateGas

▸ **estimateGas**(`tx`: Tx, `gasEstimator`: function, `caller`: function): *Promise‹number›*

*Defined in [contractkit/src/utils/web3-utils.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L24)*

**Parameters:**

▪ **tx**: *Tx*

▪ **gasEstimator**: *function*

▸ (`tx`: Tx): *Promise‹number›*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

▪ **caller**: *function*

▸ (`tx`: Tx): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Tx |

**Returns:** *Promise‹number›*

___

### `Const` getAbiTypes

▸ **getAbiTypes**(`abi`: ABIDefinition[], `methodName`: string): *string[]*

*Defined in [contractkit/src/utils/web3-utils.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`abi` | ABIDefinition[] |
`methodName` | string |

**Returns:** *string[]*

___

### `Const` parseDecodedParams

▸ **parseDecodedParams**(`params`: DecodedParamsObject): *object*

*Defined in [contractkit/src/utils/web3-utils.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | DecodedParamsObject |

**Returns:** *object*

* **args**: *any[]*

* **params**: *DecodedParamsObject*

___

###  traceBlock

▸ **traceBlock**(`web3`: Web3, `blockNumber`: number, `tracer`: string): *Promise‹any[]›*

*Defined in [contractkit/src/utils/web3-utils.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`blockNumber` | number |
`tracer` | string |

**Returns:** *Promise‹any[]›*

___

###  traceTransaction

▸ **traceTransaction**(`web3`: Web3, `transaction`: string, `tracer`: string): *Promise‹any[]›*

*Defined in [contractkit/src/utils/web3-utils.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`transaction` | string |
`tracer` | string |

**Returns:** *Promise‹any[]›*
