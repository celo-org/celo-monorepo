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

+ **new LogExplorer**\(`kit`: [ContractKit](), `contractDetails`: [ContractDetails]()\[\]\): [_LogExplorer_]()

_Defined in_ [_contractkit/src/explorer/log-explorer.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L17)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |
| `contractDetails` | [ContractDetails]()\[\] |

**Returns:** [_LogExplorer_]()

## Properties

### contractDetails

• **contractDetails**: [_ContractDetails_]()_\[\]_

_Defined in_ [_contractkit/src/explorer/log-explorer.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L19)

## Methods

### fetchTxReceipt

▸ **fetchTxReceipt**\(`txhash`: string\): _Promise‹TransactionReceipt›_

_Defined in_ [_contractkit/src/explorer/log-explorer.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L49)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `txhash` | string |

**Returns:** _Promise‹TransactionReceipt›_

### getKnownLogs

▸ **getKnownLogs**\(`tx`: TransactionReceipt\): _EventLog\[\]_

_Defined in_ [_contractkit/src/explorer/log-explorer.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L53)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `tx` | TransactionReceipt |

**Returns:** _EventLog\[\]_

### tryParseLog

▸ **tryParseLog**\(`log`: Log\): _null \| EventLog_

_Defined in_ [_contractkit/src/explorer/log-explorer.ts:64_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/explorer/log-explorer.ts#L64)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `log` | Log |

**Returns:** _null \| EventLog_

