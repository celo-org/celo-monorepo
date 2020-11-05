# Class: BaseExplorer

## Hierarchy

* **BaseExplorer**

  ↳ [BlockExplorer](_explorer_block_explorer_.blockexplorer.md)

  ↳ [LogExplorer](_explorer_log_explorer_.logexplorer.md)

## Index

### Constructors

* [constructor](_explorer_base_.baseexplorer.md#constructor)

### Methods

* [init](_explorer_base_.baseexplorer.md#init)
* [updateContractDetailsMapping](_explorer_base_.baseexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new BaseExplorer**(`kit`: [ContractKit](_kit_.contractkit.md), `abiType`: AbiType, `addressMapping`: Map‹[Address](../modules/_base_.md#address), ContractMapping›): *[BaseExplorer](_explorer_base_.baseexplorer.md)*

*Defined in [packages/contractkit/src/explorer/base.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L60)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) | - |
`abiType` | AbiType | - |
`addressMapping` | Map‹[Address](../modules/_base_.md#address), ContractMapping› | new Map() |

**Returns:** *[BaseExplorer](_explorer_base_.baseexplorer.md)*

## Methods

###  init

▸ **init**(): *Promise‹void›*

*Defined in [packages/contractkit/src/explorer/base.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L67)*

**Returns:** *Promise‹void›*

___

###  updateContractDetailsMapping

▸ **updateContractDetailsMapping**(`name`: string, `address`: string): *Promise‹void›*

*Defined in [packages/contractkit/src/explorer/base.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`address` | string |

**Returns:** *Promise‹void›*
