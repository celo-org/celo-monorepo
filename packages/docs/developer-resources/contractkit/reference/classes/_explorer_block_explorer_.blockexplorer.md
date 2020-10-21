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

## Constructors

###  constructor

\+ **new BlockExplorer**(`kit`: [ContractKit](_kit_.contractkit.md), `contractDetails`: [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]): *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contractDetails` | [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[] |

**Returns:** *[BlockExplorer](_explorer_block_explorer_.blockexplorer.md)*

## Properties

###  contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L43)*

## Methods

###  fetchBlock

▸ **fetchBlock**(`blockNumber`: number): *Promise‹Block›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹Block›*

___

###  fetchBlockByHash

▸ **fetchBlockByHash**(`blockHash`: string): *Promise‹Block›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHash` | string |

**Returns:** *Promise‹Block›*

___

###  fetchBlockRange

▸ **fetchBlockRange**(`from`: number, `to`: number): *Promise‹Block[]›*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`from` | number |
`to` | number |

**Returns:** *Promise‹Block[]›*

___

###  parseBlock

▸ **parseBlock**(`block`: Block): *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | Block |

**Returns:** *[ParsedBlock](../interfaces/_explorer_block_explorer_.parsedblock.md)*

___

###  tryParseTx

▸ **tryParseTx**(`tx`: Transaction): *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:92](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L92)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | Transaction |

**Returns:** *null | [ParsedTx](../interfaces/_explorer_block_explorer_.parsedtx.md)*

___

###  tryParseTxInput

▸ **tryParseTxInput**(`address`: string, `input`: string): *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*

*Defined in [packages/contractkit/src/explorer/block-explorer.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L104)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *null | [CallDetails](../interfaces/_explorer_block_explorer_.calldetails.md)*
