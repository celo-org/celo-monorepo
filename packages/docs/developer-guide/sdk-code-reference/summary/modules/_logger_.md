# logger

## Index

### Type aliases

* [Logger](_logger_.md#logger)

### Variables

* [consoleLogger](_logger_.md#const-consolelogger)

### Functions

* [noopLogger](_logger_.md#const-nooplogger)
* [prefixLogger](_logger_.md#const-prefixlogger)

## Type aliases

### Logger

Ƭ **Logger**: _function_

_Defined in_ [_packages/sdk/base/src/logger.ts:1_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L1)

#### Type declaration:

▸ \(...`args`: any\[\]\): _void_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | any\[\] |

## Variables

### `Const` consoleLogger

• **consoleLogger**: [_Logger_](_logger_.md#logger) = console.log

_Defined in_ [_packages/sdk/base/src/logger.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L15)

## Functions

### `Const` noopLogger

▸ **noopLogger**\(\): _void_

_Defined in_ [_packages/sdk/base/src/logger.ts:3_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L3)

**Returns:** _void_

### `Const` prefixLogger

▸ **prefixLogger**\(`prefix`: string, `logger`: [Logger](_logger_.md#logger)\): [_Logger_](_logger_.md#logger)

_Defined in_ [_packages/sdk/base/src/logger.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L7)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `prefix` | string |
| `logger` | [Logger](_logger_.md#logger) |

**Returns:** [_Logger_](_logger_.md#logger)

