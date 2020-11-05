# External module: "explorer/base"

## Index

### Classes

* [BaseExplorer](../classes/_explorer_base_.baseexplorer.md)

### Functions

* [getAddressMappingFromDetails](_explorer_base_.md#const-getaddressmappingfromdetails)
* [obtainKitContractDetails](_explorer_base_.md#const-obtainkitcontractdetails)

## Functions

### `Const` getAddressMappingFromDetails

▸ **getAddressMappingFromDetails**(`contractDetails`: ContractDetails[], `abiType`: AbiType): *Map‹string, ContractMapping›*

*Defined in [packages/contractkit/src/explorer/base.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`contractDetails` | ContractDetails[] |
`abiType` | AbiType |

**Returns:** *Map‹string, ContractMapping›*

___

### `Const` obtainKitContractDetails

▸ **obtainKitContractDetails**(`kit`: [ContractKit](../classes/_kit_.contractkit.md)): *Promise‹ContractDetails[]›*

*Defined in [packages/contractkit/src/explorer/base.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |

**Returns:** *Promise‹ContractDetails[]›*
