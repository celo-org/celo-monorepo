# Module: "explorer/base"

## Index

### Interfaces

* [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)

### Functions

* [getContractDetailsFromContract](_explorer_base_.md#const-getcontractdetailsfromcontract)
* [mapFromPairs](_explorer_base_.md#mapfrompairs)
* [obtainKitContractDetails](_explorer_base_.md#obtainkitcontractdetails)

## Functions

### `Const` getContractDetailsFromContract

▸ **getContractDetailsFromContract**(`kit`: [ContractKit](../classes/_kit_.contractkit.md), `celoContract`: [CeloContract](../enums/_base_.celocontract.md), `address?`: undefined | string): *Promise‹object›*

*Defined in [packages/contractkit/src/explorer/base.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |
`celoContract` | [CeloContract](../enums/_base_.celocontract.md) |
`address?` | undefined &#124; string |

**Returns:** *Promise‹object›*

___

###  mapFromPairs

▸ **mapFromPairs**<**A**, **B**>(`pairs`: Array‹[A, B]›): *Map‹A, B›*

*Defined in [packages/contractkit/src/explorer/base.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L32)*

**Type parameters:**

▪ **A**

▪ **B**

**Parameters:**

Name | Type |
------ | ------ |
`pairs` | Array‹[A, B]› |

**Returns:** *Map‹A, B›*

___

###  obtainKitContractDetails

▸ **obtainKitContractDetails**(`kit`: [ContractKit](../classes/_kit_.contractkit.md)): *Promise‹[ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]›*

*Defined in [packages/contractkit/src/explorer/base.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](../classes/_kit_.contractkit.md) |

**Returns:** *Promise‹[ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]›*
