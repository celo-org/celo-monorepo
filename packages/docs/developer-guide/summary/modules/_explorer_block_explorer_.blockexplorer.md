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

+ **new BlockExplorer**\(`kit`: [ContractKit](), `contractDetails`: [ContractDetails]()\[\]\): [_BlockExplorer_]()

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:56_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L56)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contractDetails` | [ContractDetails]()\[\] |

**Returns:** [_BlockExplorer_]()

## Properties

### `Readonly` contractDetails

• **contractDetails**: [_ContractDetails_]()_\[\]_

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L58)

## Methods

### fetchBlock

▸ **fetchBlock**\(`blockNumber`: number\): _Promise‹Block›_

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:73_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L73)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockNumber` | number |

**Returns:** _Promise‹Block›_

### fetchBlockByHash

▸ **fetchBlockByHash**\(`blockHash`: string\): _Promise‹Block›_

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `blockHash` | string |

**Returns:** _Promise‹Block›_

### fetchBlockRange

▸ **fetchBlockRange**\(`from`: number, `to`: number\): _Promise‹Block\[\]›_

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L77)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `from` | number |
| `to` | number |

**Returns:** _Promise‹Block\[\]›_

### parseBlock

▸ **parseBlock**\(`block`: Block\): [_ParsedBlock_]()

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L85)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `block` | Block |

**Returns:** [_ParsedBlock_]()

### tryParseTx

▸ **tryParseTx**\(`tx`: Transaction\): _null \|_ [_ParsedTx_]()

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L102)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | Transaction |

**Returns:** _null \|_ [_ParsedTx_]()

### tryParseTxInput

▸ **tryParseTxInput**\(`address`: string, `input`: string\): _null \|_ [_CallDetails_]()

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L114)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |
| `input` | string |

**Returns:** _null \|_ [_CallDetails_]()

### updateContractDetailsMapping

▸ **updateContractDetailsMapping**\(`name`: string, `address`: string\): _Promise‹void›_

_Defined in_ [_packages/contractkit/src/explorer/block-explorer.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/block-explorer.ts#L64)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string |
| `address` | string |

**Returns:** _Promise‹void›_

