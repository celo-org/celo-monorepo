# Module: "logger"

## Index

### Type aliases

* [Logger](_logger_.md#logger)

### Variables

* [consoleLogger](_logger_.md#const-consolelogger)

### Functions

* [noopLogger](_logger_.md#const-nooplogger)
* [prefixLogger](_logger_.md#const-prefixlogger)

## Type aliases

###  Logger

Ƭ **Logger**: *function*

*Defined in [packages/sdk/base/src/logger.ts:1](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L1)*

#### Type declaration:

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

## Variables

### `Const` consoleLogger

• **consoleLogger**: *[Logger](_logger_.md#logger)* = console.log

*Defined in [packages/sdk/base/src/logger.ts:15](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L15)*

## Functions

### `Const` noopLogger

▸ **noopLogger**(): *void*

*Defined in [packages/sdk/base/src/logger.ts:3](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L3)*

**Returns:** *void*

___

### `Const` prefixLogger

▸ **prefixLogger**(`prefix`: string, `logger`: [Logger](_logger_.md#logger)): *[Logger](_logger_.md#logger)*

*Defined in [packages/sdk/base/src/logger.ts:7](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/logger.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`prefix` | string |
`logger` | [Logger](_logger_.md#logger) |

**Returns:** *[Logger](_logger_.md#logger)*
