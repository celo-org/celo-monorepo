# RetryTaskOptions

## Type parameters

▪ **A**

## Hierarchy

* [TaskOptions]()

  ↳ **RetryTaskOptions**

## Index

### Properties

* [logger]()
* [maxAttemps]()
* [name]()
* [timeInBetweenMS]()
* [tryGetValue]()

## Properties

### `Optional` logger

• **logger**? : [_Logger_](_logger_.md#logger)

_Inherited from_ [_TaskOptions_]()_._[_logger_]()

_Defined in_ [_packages/sdk/base/src/task.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L20)

Logger function

### maxAttemps

• **maxAttemps**: _number_

_Defined in_ [_packages/sdk/base/src/task.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L123)

Maximum number of attemps

### name

• **name**: _string_

_Inherited from_ [_TaskOptions_]()_._[_name_]()

_Defined in_ [_packages/sdk/base/src/task.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L18)

Name for the task. To be used in logging messages

### timeInBetweenMS

• **timeInBetweenMS**: _number_

_Defined in_ [_packages/sdk/base/src/task.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L121)

seconds between repetition

### tryGetValue

• **tryGetValue**: _function_

_Defined in_ [_packages/sdk/base/src/task.ts:125_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L125)

Function that tries to obtain a value A or returns null

#### Type declaration:

▸ \(\): _Promise‹A \| null›_

