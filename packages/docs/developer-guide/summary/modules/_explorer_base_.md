# explorer/base

## Index

### Interfaces

* [ContractDetails]()

### Functions

* [getContractDetailsFromContract](_explorer_base_.md#const-getcontractdetailsfromcontract)
* [mapFromPairs](_explorer_base_.md#mapfrompairs)
* [obtainKitContractDetails](_explorer_base_.md#obtainkitcontractdetails)

## Functions

### `Const` getContractDetailsFromContract

▸ **getContractDetailsFromContract**\(`kit`: [ContractKit](), `celoContract`: [CeloContract](), `address?`: undefined \| string\): _Promise‹object›_

_Defined in_ [_packages/contractkit/src/explorer/base.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L13)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `celoContract` | [CeloContract]() |
| `address?` | undefined \| string |

**Returns:** _Promise‹object›_

### mapFromPairs

▸ **mapFromPairs**&lt;**A**, **B**&gt;\(`pairs`: Array‹\[A, B\]›\): _Map‹A, B›_

_Defined in_ [_packages/contractkit/src/explorer/base.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L32)

**Type parameters:**

▪ **A**

▪ **B**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `pairs` | Array‹\[A, B\]› |

**Returns:** _Map‹A, B›_

### obtainKitContractDetails

▸ **obtainKitContractDetails**\(`kit`: [ContractKit]()\): _Promise‹_[_ContractDetails_]()_\[\]›_

_Defined in_ [_packages/contractkit/src/explorer/base.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L26)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** _Promise‹_[_ContractDetails_]()_\[\]›_

