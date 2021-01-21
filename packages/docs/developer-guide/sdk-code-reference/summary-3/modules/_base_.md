# base

## Index

### Interfaces

* [ContractDetails]()

### Functions

* [getContractDetailsFromContract](_base_.md#const-getcontractdetailsfromcontract)
* [mapFromPairs](_base_.md#mapfrompairs)
* [obtainKitContractDetails](_base_.md#obtainkitcontractdetails)

## Functions

### `Const` getContractDetailsFromContract

▸ **getContractDetailsFromContract**\(`kit`: ContractKit, `celoContract`: CeloContract, `address?`: undefined \| string\): _Promise‹object›_

_Defined in_ [_base.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L11)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `celoContract` | CeloContract |
| `address?` | undefined \| string |

**Returns:** _Promise‹object›_

### mapFromPairs

▸ **mapFromPairs**&lt;**A**, **B**&gt;\(`pairs`: Array‹\[A, B\]›\): _Map‹A, B›_

_Defined in_ [_base.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L30)

**Type parameters:**

▪ **A**

▪ **B**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `pairs` | Array‹\[A, B\]› |

**Returns:** _Map‹A, B›_

### obtainKitContractDetails

▸ **obtainKitContractDetails**\(`kit`: ContractKit\): _Promise‹_[_ContractDetails_]()_\[\]›_

_Defined in_ [_base.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/base.ts#L24)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |

**Returns:** _Promise‹_[_ContractDetails_]()_\[\]›_

