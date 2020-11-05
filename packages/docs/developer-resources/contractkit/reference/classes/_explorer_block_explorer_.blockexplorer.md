# Class: BlockExplorer

## Hierarchy

* [BaseExplorer](_explorer_base_.baseexplorer.md)

  ↳ **BlockExplorer**

## Index

### Constructors

* [constructor](_explorer_block_explorer_.blockexplorer.md#constructor)

### Methods

* [fetchBlock](_explorer_block_explorer_.blockexplorer.md#fetchblock)
* [fetchBlockByHash](_explorer_block_explorer_.blockexplorer.md#fetchblockbyhash)
* [fetchBlockRange](_explorer_block_explorer_.blockexplorer.md#fetchblockrange)
* [init](_explorer_block_explorer_.blockexplorer.md#init)
* [parseBlock](_explorer_block_explorer_.blockexplorer.md#parseblock)
* [tryParseTx](_explorer_block_explorer_.blockexplorer.md#tryparsetx)
* [tryParseTxInput](_explorer_block_explorer_.blockexplorer.md#tryparsetxinput)
* [updateContractDetailsMapping](_explorer_block_explorer_.blockexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new BlockExplorer**(`kit`: [ContractKit](_kit_.contractkit.md)): *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

*Overrides [BaseExplorer](_explorer_base_.baseexplorer.md).[constructor](_explorer_base_.baseexplorer.md#constructor)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L35)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

## Methods

###  fetchBlock

▸ **fetchBlock**(`blockNumber`: number): *Promise‹Block›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹Block›*

___

###  fetchBlockByHash

▸ **fetchBlockByHash**(`blockHash`: string): *Promise‹Block›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHash` | string |

**Returns:** *Promise‹Block›*

___

###  fetchBlockRange

▸ **fetchBlockRange**(`from`: number, `to`: number): *Promise‹Block[]›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`from` | number |
`to` | number |

**Returns:** *Promise‹Block[]›*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [BaseExplorer](_explorer_base_.baseexplorer.md).[init](_explorer_base_.baseexplorer.md#init)*

*Defined in [packages/contractkit/src/explorer/base.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L67)*

**Returns:** *Promise‹void›*

___

###  parseBlock

▸ **parseBlock**(`block`: Block): *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | Block |

**Returns:** *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

___

###  tryParseTx

▸ **tryParseTx**(`tx`: Transaction): *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Transaction |

**Returns:** *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

___

###  tryParseTxInput

▸ **tryParseTxInput**(`address`: string, `input`: string): *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*

___

###  updateContractDetailsMapping

▸ **updateContractDetailsMapping**(`name`: string, `address`: string): *Promise‹void›*

*Inherited from [BaseExplorer](_explorer_base_.baseexplorer.md).[updateContractDetailsMapping](_explorer_base_.baseexplorer.md#updatecontractdetailsmapping)*

*Defined in [packages/contractkit/src/explorer/base.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`address` | string |

**Returns:** *Promise‹void›*
