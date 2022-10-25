[@celo/explorer](../README.md) › ["block-explorer"](../modules/_block_explorer_.md) › [BlockExplorer](_block_explorer_.blockexplorer.md)

# Class: BlockExplorer

## Hierarchy

* **BlockExplorer**

## Index

### Constructors

* [constructor](_block_explorer_.blockexplorer.md#constructor)

### Properties

* [contractDetails](_block_explorer_.blockexplorer.md#readonly-contractdetails)

### Methods

* [buildCallDetails](_block_explorer_.blockexplorer.md#buildcalldetails)
* [fetchBlock](_block_explorer_.blockexplorer.md#fetchblock)
* [fetchBlockByHash](_block_explorer_.blockexplorer.md#fetchblockbyhash)
* [fetchBlockRange](_block_explorer_.blockexplorer.md#fetchblockrange)
* [getContractMethodAbi](_block_explorer_.blockexplorer.md#getcontractmethodabi)
* [getKnownFunction](_block_explorer_.blockexplorer.md#getknownfunction)
* [parseBlock](_block_explorer_.blockexplorer.md#parseblock)
* [tryParseAsCoreContractCall](_block_explorer_.blockexplorer.md#tryparseascorecontractcall)
* [tryParseAsExternalContractCall](_block_explorer_.blockexplorer.md#tryparseasexternalcontractcall)
* [tryParseTx](_block_explorer_.blockexplorer.md#tryparsetx)
* [tryParseTxInput](_block_explorer_.blockexplorer.md#tryparsetxinput)
* [updateContractDetailsMapping](_block_explorer_.blockexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new BlockExplorer**(`kit`: ContractKit, `contractDetails`: [ContractDetails](../interfaces/_base_.contractdetails.md)[]): *[BlockExplorer](_block_explorer_.blockexplorer.md)*

*Defined in [block-explorer.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`contractDetails` | [ContractDetails](../interfaces/_base_.contractdetails.md)[] |

**Returns:** *[BlockExplorer](_block_explorer_.blockexplorer.md)*

## Properties

### `Readonly` contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_base_.contractdetails.md)[]*

*Defined in [block-explorer.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L61)*

## Methods

###  buildCallDetails

▸ **buildCallDetails**(`contract`: string, `abi`: ABIDefinition, `input`: string): *[CallDetails](../interfaces/_block_explorer_.calldetails.md)*

*Defined in [block-explorer.ts:140](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L140)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | string |
`abi` | ABIDefinition |
`input` | string |

**Returns:** *[CallDetails](../interfaces/_block_explorer_.calldetails.md)*

___

###  fetchBlock

▸ **fetchBlock**(`blockNumber`: number): *Promise‹Block›*

*Defined in [block-explorer.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`blockNumber` | number |

**Returns:** *Promise‹Block›*

___

###  fetchBlockByHash

▸ **fetchBlockByHash**(`blockHash`: string): *Promise‹Block›*

*Defined in [block-explorer.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`blockHash` | string |

**Returns:** *Promise‹Block›*

___

###  fetchBlockRange

▸ **fetchBlockRange**(`from`: number, `to`: number): *Promise‹Block[]›*

*Defined in [block-explorer.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L81)*

**Parameters:**

Name | Type |
------ | ------ |
`from` | number |
`to` | number |

**Returns:** *Promise‹Block[]›*

___

###  getContractMethodAbi

▸ **getContractMethodAbi**(`address`: string, `callSignature`: string): *object*

*Defined in [block-explorer.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L118)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`callSignature` | string |

**Returns:** *object*

* **abi**: *undefined | ABIDefinition* = contractMapping?.fnMapping.get(callSignature)

* **contract**: *undefined | string* = contractMapping?.details.name

___

###  getKnownFunction

▸ **getKnownFunction**(`selector`: string): *ABIDefinition | undefined*

*Defined in [block-explorer.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`selector` | string |

**Returns:** *ABIDefinition | undefined*

___

###  parseBlock

▸ **parseBlock**(`block`: Block): *Promise‹[ParsedBlock](../interfaces/_block_explorer_.parsedblock.md)›*

*Defined in [block-explorer.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`block` | Block |

**Returns:** *Promise‹[ParsedBlock](../interfaces/_block_explorer_.parsedblock.md)›*

___

###  tryParseAsCoreContractCall

▸ **tryParseAsCoreContractCall**(`address`: string, `input`: string): *[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null*

*Defined in [block-explorer.ts:170](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L170)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null*

___

###  tryParseAsExternalContractCall

▸ **tryParseAsExternalContractCall**(`address`: string, `input`: string): *[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null*

*Defined in [block-explorer.ts:181](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L181)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null*

___

###  tryParseTx

▸ **tryParseTx**(`tx`: CeloTxPending): *Promise‹null | [ParsedTx](../interfaces/_block_explorer_.parsedtx.md)›*

*Defined in [block-explorer.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L106)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTxPending |

**Returns:** *Promise‹null | [ParsedTx](../interfaces/_block_explorer_.parsedtx.md)›*

___

###  tryParseTxInput

▸ **tryParseTxInput**(`address`: string, `input`: string): *Promise‹[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null›*

*Defined in [block-explorer.ts:191](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L191)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`input` | string |

**Returns:** *Promise‹[CallDetails](../interfaces/_block_explorer_.calldetails.md) | null›*

___

###  updateContractDetailsMapping

▸ **updateContractDetailsMapping**(`name`: CeloContract, `address`: string): *Promise‹void›*

*Defined in [block-explorer.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/block-explorer.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | CeloContract |
`address` | string |

**Returns:** *Promise‹void›*
