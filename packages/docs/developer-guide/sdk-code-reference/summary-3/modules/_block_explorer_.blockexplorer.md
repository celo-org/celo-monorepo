# BlockExplorer

## Hierarchy

* **BlockExplorer**

## Index

### Constructors

* [constructor]()

### Properties

* [contractDetails]()

### Methods

* [fetchBlock]()
* [fetchBlockByHash]()
* [fetchBlockRange]()
* [parseBlock]()
* [tryParseTx]()
* [tryParseTxInput]()
* [updateContractDetailsMapping]()

## Constructors

### constructor

+ **new BlockExplorer**\(`kit`: ContractKit, `contractDetails`: [ContractDetails]()\[\]\): [_BlockExplorer_]()

_Defined in_ [_block-explorer.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `contractDetails` | [ContractDetails]()\[\] |

**Returns:** [_BlockExplorer_]()

## Properties

### `Readonly` contractDetails

• **contractDetails**: [_ContractDetails_]()_\[\]_

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

▸ **parseBlock**\(`block`: Block\): _Promise‹_[_ParsedBlock_]()_›_

_Defined in_ [_block-explorer.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L80)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `block` | Block |

**Returns:** _Promise‹_[_ParsedBlock_]()_›_

### tryParseTx

▸ **tryParseTx**\(`tx`: CeloTxPending\): _Promise‹null \|_ [_ParsedTx_]()_›_

_Defined in_ [_block-explorer.ts:97_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L97)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTxPending |

**Returns:** _Promise‹null \|_ [_ParsedTx_]()_›_

### tryParseTxInput

▸ **tryParseTxInput**\(`address`: string, `input`: string\): _Promise‹null \|_ [_CallDetails_]()_›_

_Defined in_ [_block-explorer.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L109)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `input` | string |

**Returns:** _Promise‹null \|_ [_CallDetails_]()_›_

### updateContractDetailsMapping

▸ **updateContractDetailsMapping**\(`name`: string, `address`: string\): _Promise‹void›_

_Defined in_ [_block-explorer.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L60)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string |
| `address` | string |

**Returns:** _Promise‹void›_

