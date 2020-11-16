# Class: BlockExplorer

## Hierarchy

* **BlockExplorer**

## Index

### Constructors

* [constructor](_explorer_block_explorer_.blockexplorer.md#constructor)

### Properties

* [contractDetails](_explorer_block_explorer_.blockexplorer.md#contractdetails)

### Methods

* [fetchBlock](_explorer_block_explorer_.blockexplorer.md#fetchblock)
* [fetchBlockByHash](_explorer_block_explorer_.blockexplorer.md#fetchblockbyhash)
* [fetchBlockRange](_explorer_block_explorer_.blockexplorer.md#fetchblockrange)
* [parseBlock](_explorer_block_explorer_.blockexplorer.md#parseblock)
* [tryParseTx](_explorer_block_explorer_.blockexplorer.md#tryparsetx)
* [tryParseTxInput](_explorer_block_explorer_.blockexplorer.md#tryparsetxinput)
* [updateContractDetailsMapping](_explorer_block_explorer_.blockexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new BlockExplorer**(`kit`: [ContractKit](_kit_.contractkit.md), `contractDetails`: [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]): *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

*Defined in [contractkit/src/explorer/block-explorer.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contractDetails` | [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[] |

**Returns:** *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

## Properties

###  contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]*

*Defined in [contractkit/src/explorer/block-explorer.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L58)*

## Methods

###  fetchBlock

▸ **fetchBlock**(`blockNumber`: number): *Promise‹Block›*

*Defined in [contractkit/src/explorer/block-explorer.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹Block›*

___

###  fetchBlockByHash

▸ **fetchBlockByHash**(`blockHash`: string): *Promise‹Block›*

*Defined in [contractkit/src/explorer/block-explorer.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHash` | string |

**Returns:** *Promise‹Block›*

___

###  fetchBlockRange

▸ **fetchBlockRange**(`from`: number, `to`: number): *Promise‹Block[]›*

*Defined in [contractkit/src/explorer/block-explorer.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`from` | number |
`to` | number |

**Returns:** *Promise‹Block[]›*

___

###  parseBlock

▸ **parseBlock**(`block`: Block): *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

*Defined in [contractkit/src/explorer/block-explorer.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | Block |

**Returns:** *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

___

###  tryParseTx

▸ **tryParseTx**(`tx`: Transaction): *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

*Defined in [contractkit/src/explorer/block-explorer.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L102)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Transaction |

**Returns:** *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

___

###  tryParseTxInput

▸ **tryParseTxInput**(`address`: string, `input`: string): *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*

*Defined in [contractkit/src/explorer/block-explorer.ts:114](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L114)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*

___

###  updateContractDetailsMapping

▸ **updateContractDetailsMapping**(`name`: string, `address`: string): *Promise‹void›*

*Defined in [contractkit/src/explorer/block-explorer.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`address` | string |

**Returns:** *Promise‹void›*
