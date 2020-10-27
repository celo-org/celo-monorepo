# External module: "base/src/logger"

## Index

### Type aliases

* [Logger](_base_src_logger_.md#logger)

### Variables

* [consoleLogger](_base_src_logger_.md#const-consolelogger)

### Functions

* [noopLogger](_base_src_logger_.md#const-nooplogger)
* [prefixLogger](_base_src_logger_.md#const-prefixlogger)

## Type aliases

###  Logger

Ƭ **Logger**: *function*

*Defined in [packages/base/src/logger.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/logger.ts#L1)*

#### Type declaration:

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |

## Variables

### `Const` consoleLogger

• **consoleLogger**: *[Logger](_base_src_logger_.md#logger)* = console.log

*Defined in [packages/base/src/logger.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/logger.ts#L15)*

## Functions

### `Const` noopLogger

▸ **noopLogger**(): *void*

*Defined in [packages/base/src/logger.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/logger.ts#L3)*

**Returns:** *void*

___

### `Const` prefixLogger

▸ **prefixLogger**(`prefix`: string, `logger`: [Logger](_base_src_logger_.md#logger)): *function*

*Defined in [packages/base/src/logger.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/logger.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`prefix` | string |
`logger` | [Logger](_base_src_logger_.md#logger) |

**Returns:** *function*

▸ (...`args`: any[]): *void*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | any[] |
