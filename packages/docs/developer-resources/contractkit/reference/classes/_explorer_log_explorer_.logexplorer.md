# Class: LogExplorer

## Hierarchy

* **LogExplorer**

## Index

### Constructors

* [constructor](_explorer_log_explorer_.logexplorer.md#constructor)

### Properties

* [contractDetails](_explorer_log_explorer_.logexplorer.md#contractdetails)

### Methods

* [fetchTxReceipt](_explorer_log_explorer_.logexplorer.md#fetchtxreceipt)
* [getKnownLogs](_explorer_log_explorer_.logexplorer.md#getknownlogs)
* [tryParseLog](_explorer_log_explorer_.logexplorer.md#tryparselog)

## Constructors

###  constructor

\+ **new LogExplorer**(`kit`: [ContractKit](_kit_.contractkit.md), `contractDetails`: [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]): *[LogExplorer](_explorer_log_explorer_.logexplorer.md)*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |
`contractDetails` | [ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[] |

**Returns:** *[LogExplorer](_explorer_log_explorer_.logexplorer.md)*

## Properties

###  contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_explorer_base_.contractdetails.md)[]*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L19)*

## Methods

###  fetchTxReceipt

▸ **fetchTxReceipt**(`txhash`: string): *Promise‹TransactionReceipt›*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹TransactionReceipt›*

___

###  getKnownLogs

▸ **getKnownLogs**(`tx`: TransactionReceipt): *EventLog[]*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | TransactionReceipt |

**Returns:** *EventLog[]*

___

###  tryParseLog

▸ **tryParseLog**(`log`: Log): *null | EventLog*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | Log |

**Returns:** *null | EventLog*
