# Class: BlockExplorer

## Hierarchy

* **BlockExplorer**

## Index

### Constructors

* [constructor](_block_explorer_.blockexplorer.md#constructor)

### Properties

* [contractDetails](_block_explorer_.blockexplorer.md#readonly-contractdetails)

### Methods

* [fetchBlock](_block_explorer_.blockexplorer.md#fetchblock)
* [fetchBlockByHash](_block_explorer_.blockexplorer.md#fetchblockbyhash)
* [fetchBlockRange](_block_explorer_.blockexplorer.md#fetchblockrange)
* [parseBlock](_block_explorer_.blockexplorer.md#parseblock)
* [tryParseTx](_block_explorer_.blockexplorer.md#tryparsetx)
* [tryParseTxInput](_block_explorer_.blockexplorer.md#tryparsetxinput)
* [updateContractDetailsMapping](_block_explorer_.blockexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new BlockExplorer**(`kit`: ContractKit, `contractDetails`: [ContractDetails](../interfaces/_base_.contractdetails.md)[]): *[BlockExplorer](_block_explorer_.blockexplorer.md)*

*Defined in [block-explorer.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`contractDetails` | [ContractDetails](../interfaces/_base_.contractdetails.md)[] |

**Returns:** *[BlockExplorer](_block_explorer_.blockexplorer.md)*

## Properties

### `Readonly` contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_base_.contractdetails.md)[]*

*Defined in [block-explorer.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L54)*

## Methods

###  fetchBlock

▸ **fetchBlock**(`blockNumber`: number): *Promise‹Block›*

*Defined in [block-explorer.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹Block›*

___

###  fetchBlockByHash

▸ **fetchBlockByHash**(`blockHash`: string): *Promise‹Block›*

*Defined in [block-explorer.ts:65](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L65)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHash` | string |

**Returns:** *Promise‹Block›*

___

###  fetchBlockRange

▸ **fetchBlockRange**(`from`: number, `to`: number): *Promise‹Block[]›*

*Defined in [block-explorer.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`from` | number |
`to` | number |

**Returns:** *Promise‹Block[]›*

___

###  parseBlock

▸ **parseBlock**(`block`: Block): *Promise‹[ParsedBlock](../interfaces/_block_explorer_.parsedblock.md)›*

*Defined in [block-explorer.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | Block |

**Returns:** *Promise‹[ParsedBlock](../interfaces/_block_explorer_.parsedblock.md)›*

___

###  tryParseTx

▸ **tryParseTx**(`tx`: CeloTxPending): *Promise‹null | [ParsedTx](../interfaces/_block_explorer_.parsedtx.md)›*

*Defined in [block-explorer.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTxPending |

**Returns:** *Promise‹null | [ParsedTx](../interfaces/_block_explorer_.parsedtx.md)›*

___

###  tryParseTxInput

▸ **tryParseTxInput**(`address`: string, `input`: string): *Promise‹null | [CallDetails](../interfaces/_block_explorer_.calldetails.md)›*

*Defined in [block-explorer.ts:109](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L109)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *Promise‹null | [CallDetails](../interfaces/_block_explorer_.calldetails.md)›*

___

###  updateContractDetailsMapping

▸ **updateContractDetailsMapping**(`name`: string, `address`: string): *Promise‹void›*

*Defined in [block-explorer.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string |
`address` | string |

**Returns:** *Promise‹void›*
