# Class: LogExplorer

## Hierarchy

* **LogExplorer**

## Index

### Constructors

* [constructor](_log_explorer_.logexplorer.md#constructor)

### Properties

* [contractDetails](_log_explorer_.logexplorer.md#readonly-contractdetails)

### Methods

* [fetchTxReceipt](_log_explorer_.logexplorer.md#fetchtxreceipt)
* [getKnownLogs](_log_explorer_.logexplorer.md#getknownlogs)
* [tryParseLog](_log_explorer_.logexplorer.md#tryparselog)

## Constructors

###  constructor

\+ **new LogExplorer**(`kit`: ContractKit, `contractDetails`: [ContractDetails](../interfaces/_base_.contractdetails.md)[]): *[LogExplorer](_log_explorer_.logexplorer.md)*

*Defined in [log-explorer.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`kit` | ContractKit |
`contractDetails` | [ContractDetails](../interfaces/_base_.contractdetails.md)[] |

**Returns:** *[LogExplorer](_log_explorer_.logexplorer.md)*

## Properties

### `Readonly` contractDetails

• **contractDetails**: *[ContractDetails](../interfaces/_base_.contractdetails.md)[]*

*Defined in [log-explorer.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L17)*

## Methods

###  fetchTxReceipt

▸ **fetchTxReceipt**(`txhash`: string): *Promise‹CeloTxReceipt | null›*

*Defined in [log-explorer.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`txhash` | string |

**Returns:** *Promise‹CeloTxReceipt | null›*

___

###  getKnownLogs

▸ **getKnownLogs**(`tx`: CeloTxReceipt): *EventLog[]*

*Defined in [log-explorer.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L51)*

**Parameters:**

Name | Type |
------ | ------ |
`tx` | CeloTxReceipt |

**Returns:** *EventLog[]*

___

###  tryParseLog

▸ **tryParseLog**(`log`: Log): *null | EventLog*

*Defined in [log-explorer.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`log` | Log |

**Returns:** *null | EventLog*
