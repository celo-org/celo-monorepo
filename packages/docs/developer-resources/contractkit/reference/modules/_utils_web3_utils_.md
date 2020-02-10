# External module: "utils/web3-utils"

## Index

### Functions

* [addLocalAccount](_utils_web3_utils_.md#addlocalaccount)
* [getAbiTypes](_utils_web3_utils_.md#const-getabitypes)
* [parseDecodedParams](_utils_web3_utils_.md#const-parsedecodedparams)

## Functions

###  addLocalAccount

▸ **addLocalAccount**(`web3`: Web3, `privateKey`: string): *Web3*

*Defined in [packages/contractkit/src/utils/web3-utils.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`web3` | Web3 |
`privateKey` | string |

**Returns:** *Web3*

___

### `Const` getAbiTypes

▸ **getAbiTypes**(`abi`: ABIDefinition[], `methodName`: string): *string[]*

*Defined in [packages/contractkit/src/utils/web3-utils.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`abi` | ABIDefinition[] |
`methodName` | string |

**Returns:** *string[]*

___

### `Const` parseDecodedParams

▸ **parseDecodedParams**(`params`: DecodedParamsObject): *object*

*Defined in [packages/contractkit/src/utils/web3-utils.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/web3-utils.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`params` | DecodedParamsObject |

**Returns:** *object*

* **args**: *any[]*

* **params**: *DecodedParamsObject*
