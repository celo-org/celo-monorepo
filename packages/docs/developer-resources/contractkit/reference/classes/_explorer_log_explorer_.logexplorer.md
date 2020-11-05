# Class: LogExplorer

## Hierarchy

* [BaseExplorer](_explorer_base_.baseexplorer.md)

  ↳ **LogExplorer**

## Index

### Constructors

* [constructor](_explorer_log_explorer_.logexplorer.md#constructor)

### Methods

* [fetchTxReceipt](_explorer_log_explorer_.logexplorer.md#fetchtxreceipt)
* [getKnownLogs](_explorer_log_explorer_.logexplorer.md#getknownlogs)
* [init](_explorer_log_explorer_.logexplorer.md#init)
* [tryParseLog](_explorer_log_explorer_.logexplorer.md#tryparselog)
* [updateContractDetailsMapping](_explorer_log_explorer_.logexplorer.md#updatecontractdetailsmapping)

## Constructors

###  constructor

\+ **new LogExplorer**(`kit`: [ContractKit](_kit_.contractkit.md)): *[LogExplorer](_explorer_log_explorer_.logexplorer.md)*

*Overrides [BaseExplorer](_explorer_base_.baseexplorer.md).[constructor](_explorer_base_.baseexplorer.md#constructor)*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** *[LogExplorer](_explorer_log_explorer_.logexplorer.md)*

## Methods

###  fetchTxReceipt

▸ **fetchTxReceipt**(`txhash`: string): *Promise‹TransactionReceipt›*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹TransactionReceipt›*

___

###  getKnownLogs

▸ **getKnownLogs**(`tx`: TransactionReceipt): *EventLog[]*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L21)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | TransactionReceipt |

**Returns:** *EventLog[]*

___

###  init

▸ **init**(): *Promise‹void›*

*Inherited from [BaseExplorer](_explorer_base_.baseexplorer.md).[init](_explorer_base_.baseexplorer.md#init)*

*Defined in [packages/contractkit/src/explorer/base.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/base.ts#L67)*

**Returns:** *Promise‹void›*

___

###  tryParseLog

▸ **tryParseLog**(`log`: Log): *null | EventLog*

*Defined in [packages/contractkit/src/explorer/log-explorer.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | Log |

**Returns:** *null | EventLog*

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
