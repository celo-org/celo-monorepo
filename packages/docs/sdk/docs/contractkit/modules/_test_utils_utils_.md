[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["test-utils/utils"](_test_utils_utils_.md)

# Module: "test-utils/utils"

## Index

### Functions

* [currentEpochNumber](_test_utils_utils_.md#const-currentepochnumber)
* [mineToNextEpoch](_test_utils_utils_.md#const-minetonextepoch)

## Functions

### `Const` currentEpochNumber

▸ **currentEpochNumber**(`web3`: Web3, `epochSize`: number): *Promise‹number›*

*Defined in [packages/sdk/contractkit/src/test-utils/utils.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/test-utils/utils.ts#L5)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`web3` | Web3 | - |
`epochSize` | number | GANACHE_EPOCH_SIZE |

**Returns:** *Promise‹number›*

___

### `Const` mineToNextEpoch

▸ **mineToNextEpoch**(`web3`: Web3, `epochSize`: number): *Promise‹void›*

*Defined in [packages/sdk/contractkit/src/test-utils/utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/test-utils/utils.ts#L32)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`web3` | Web3 | - |
`epochSize` | number | GANACHE_EPOCH_SIZE |

**Returns:** *Promise‹void›*
