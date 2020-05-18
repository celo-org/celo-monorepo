# BlockExplorer

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

### constructor

+ **new BlockExplorer**\(`kit`: [ContractKit](_kit_.contractkit.md), `contractDetails`: [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)\[\]\): [_BlockExplorer_](_explorer_block_explorer_.blockexplorer.md)

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |
| `contractDetails` | [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)\[\] |

**Returns:** [_BlockExplorer_](_explorer_block_explorer_.blockexplorer.md)

## Properties

### contractDetails

• **contractDetails**: [_ContractDetails_](../interfaces/_explorer_base_.contractdetails.md)_\[\]_

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L38)

## Methods

### fetchBlock

▸ **fetchBlock**\(`blockNumber`: number\): _Promise‹Block›_

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L58)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹Block›_

### fetchBlockByHash

▸ **fetchBlockByHash**\(`blockHash`: string\): _Promise‹Block›_

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L54)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockHash` | string |

**Returns:** _Promise‹Block›_

### fetchBlockRange

▸ **fetchBlockRange**\(`from`: number, `to`: number\): _Promise‹Block\[\]›_

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L62)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | number |
| `to` | number |

**Returns:** _Promise‹Block\[\]›_

### parseBlock

▸ **parseBlock**\(`block`: Block\): [_ParsedBlock_](../interfaces/_explorer_block_explorer_.parsedblock.md)

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:70_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L70)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `block` | Block |

**Returns:** [_ParsedBlock_](../interfaces/_explorer_block_explorer_.parsedblock.md)

### tryParseTx

▸ **tryParseTx**\(`tx`: Transaction\): _null \|_ [_ParsedTx_](../interfaces/_explorer_block_explorer_.parsedtx.md)

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L87)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Transaction |

**Returns:** _null \|_ [_ParsedTx_](../interfaces/_explorer_block_explorer_.parsedtx.md)

### tryParseTxInput

▸ **tryParseTxInput**\(`address`: string, `input`: string\): _null \|_ [_CallDetails_](../interfaces/_explorer_block_explorer_.calldetails.md)

_Defined in_ [_contractkit/src/explorer/block-explorer.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L99)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `input` | string |

**Returns:** _null \|_ [_CallDetails_](../interfaces/_explorer_block_explorer_.calldetails.md)

