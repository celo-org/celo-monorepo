# LogExplorer

## Hierarchy

* **LogExplorer**

## Index

### Constructors

* [constructor]()

### Properties

* [contractDetails]()

### Methods

* [fetchTxReceipt]()
* [getKnownLogs]()
* [tryParseLog]()

## Constructors

### constructor

+ **new LogExplorer**\(`kit`: ContractKit, `contractDetails`: [ContractDetails]()\[\]\): [_LogExplorer_]()

_Defined in_ [_log-explorer.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L15)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | ContractKit |
| `contractDetails` | [ContractDetails]()\[\] |

**Returns:** [_LogExplorer_]()

## Properties

### `Readonly` contractDetails

• **contractDetails**: [_ContractDetails_]()_\[\]_

_Defined in_ [_log-explorer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L17)

## Methods

### fetchTxReceipt

▸ **fetchTxReceipt**\(`txhash`: string\): _Promise‹CeloTxReceipt \| null›_

_Defined in_ [_log-explorer.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L47)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹CeloTxReceipt \| null›_

### getKnownLogs

▸ **getKnownLogs**\(`tx`: CeloTxReceipt\): _EventLog\[\]_

_Defined in_ [_log-explorer.ts:51_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L51)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | CeloTxReceipt |

**Returns:** _EventLog\[\]_

### tryParseLog

▸ **tryParseLog**\(`log`: Log\): _null \| EventLog_

_Defined in_ [_log-explorer.ts:62_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/explorer/src/log-explorer.ts#L62)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `log` | Log |

**Returns:** _null \| EventLog_

