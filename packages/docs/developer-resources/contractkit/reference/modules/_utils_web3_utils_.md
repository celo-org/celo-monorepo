# External module: "utils/web3-utils"

## Index

### Functions

* [getAbiTypes](_utils_web3_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_web3_utils_.md#const-parsedecodedparams)
* [traceBlock](_utils_web3_utils_.md#traceblock)
* [traceTransaction](_utils_web3_utils_.md#tracetransaction)

## Functions

### `Const` getAbiTypes

▸ **getAbiTypes**(`abi`: ABIDefinition[], `methodName`: string): *string[]*

*Defined in [contractkit/src/utils/web3-utils.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`abi` | ABIDefinition[] |
`methodName` | string |

**Returns:** *string[]*

___

### `Const` parseDecodedParams

▸ **parseDecodedParams**(`params`: DecodedParamsObject): *object*

*Defined in [contractkit/src/utils/web3-utils.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L10)*

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

*Defined in [contractkit/src/utils/web3-utils.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L38)*

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

*Defined in [contractkit/src/utils/web3-utils.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`transaction` | string |
`tracer` | string |

**Returns:** *Promise‹any[]›*
