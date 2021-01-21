# BlockExplorer

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

### constructor

+ **new BlockExplorer**\(`kit`: ContractKit, `contractDetails`: [ContractDetails](../interfaces/_base_.contractdetails.md)\[\]\): [_BlockExplorer_](_block_explorer_.blockexplorer.md)

_Defined in_ [_block-explorer.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `contractDetails` | [ContractDetails](../interfaces/_base_.contractdetails.md)\[\] |

**Returns:** [_BlockExplorer_](_block_explorer_.blockexplorer.md)

## Properties

### `Readonly` contractDetails

• **contractDetails**: [_ContractDetails_](../interfaces/_base_.contractdetails.md)_\[\]_

_Defined in_ [_block-explorer.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L54)

## Methods

### fetchBlock

▸ **fetchBlock**\(`blockNumber`: number\): _Promise‹Block›_

_Defined in_ [_block-explorer.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L68)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹Block›_

### fetchBlockByHash

▸ **fetchBlockByHash**\(`blockHash`: string\): _Promise‹Block›_

_Defined in_ [_block-explorer.ts:65_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L65)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockHash` | string |

**Returns:** _Promise‹Block›_

### fetchBlockRange

▸ **fetchBlockRange**\(`from`: number, `to`: number\): _Promise‹Block\[\]›_

_Defined in_ [_block-explorer.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L72)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | number |
| `to` | number |

**Returns:** _Promise‹Block\[\]›_

### parseBlock

▸ **parseBlock**\(`block`: Block\): _Promise‹_[_ParsedBlock_](../interfaces/_block_explorer_.parsedblock.md)_›_

_Defined in_ [_block-explorer.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L80)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `block` | Block |

**Returns:** _Promise‹_[_ParsedBlock_](../interfaces/_block_explorer_.parsedblock.md)_›_

### tryParseTx

▸ **tryParseTx**\(`tx`: CeloTxPending\): _Promise‹null \|_ [_ParsedTx_](../interfaces/_block_explorer_.parsedtx.md)_›_

_Defined in_ [_block-explorer.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L97)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTxPending |

**Returns:** _Promise‹null \|_ [_ParsedTx_](../interfaces/_block_explorer_.parsedtx.md)_›_

### tryParseTxInput

▸ **tryParseTxInput**\(`address`: string, `input`: string\): _Promise‹null \|_ [_CallDetails_](../interfaces/_block_explorer_.calldetails.md)_›_

_Defined in_ [_block-explorer.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L109)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `input` | string |

**Returns:** _Promise‹null \|_ [_CallDetails_](../interfaces/_block_explorer_.calldetails.md)_›_

### updateContractDetailsMapping

▸ **updateContractDetailsMapping**\(`name`: string, `address`: string\): _Promise‹void›_

_Defined in_ [_block-explorer.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L60)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string |
| `address` | string |

**Returns:** _Promise‹void›_

