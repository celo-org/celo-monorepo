# Module: "base"

## Index

### Interfaces

* [ContractDetails](../interfaces/_base_.contractdetails.md)

### Functions

* [getContractDetailsFromContract](_base_.md#const-getcontractdetailsfromcontract)
* [mapFromPairs](_base_.md#mapfrompairs)
* [obtainKitContractDetails](_base_.md#obtainkitcontractdetails)

## Functions

### `Const` getContractDetailsFromContract

▸ **getContractDetailsFromContract**(`kit`: ContractKit, `celoContract`: CeloContract, `address?`: undefined | string): *Promise‹object›*

*Defined in [base.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`celoContract` | CeloContract |
`address?` | undefined &#124; string |

**Returns:** *Promise‹object›*

___

###  mapFromPairs

▸ **mapFromPairs**<**A**, **B**>(`pairs`: Array‹[A, B]›): *Map‹A, B›*

*Defined in [base.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L30)*

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

▸ **obtainKitContractDetails**(`kit`: ContractKit): *Promise‹[ContractDetails](../interfaces/_base_.contractdetails.md)[]›*

*Defined in [base.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |

**Returns:** *Promise‹[ContractDetails](../interfaces/_base_.contractdetails.md)[]›*
