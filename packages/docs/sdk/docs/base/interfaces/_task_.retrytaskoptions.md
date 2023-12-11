[@celo/base](../README.md) › ["task"](../modules/_task_.md) › [RetryTaskOptions](_task_.retrytaskoptions.md)

# Interface: RetryTaskOptions ‹**A**›

## Type parameters

▪ **A**

## Hierarchy

* [TaskOptions](_task_.taskoptions.md)

  ↳ **RetryTaskOptions**

## Index

### Properties

* [logger](_task_.retrytaskoptions.md#optional-logger)
* [maxAttemps](_task_.retrytaskoptions.md#maxattemps)
* [name](_task_.retrytaskoptions.md#name)
* [timeInBetweenMS](_task_.retrytaskoptions.md#timeinbetweenms)
* [tryGetValue](_task_.retrytaskoptions.md#trygetvalue)

## Properties

### `Optional` logger

• **logger**? : *[Logger](../modules/_logger_.md#logger)*

*Inherited from [TaskOptions](_task_.taskoptions.md).[logger](_task_.taskoptions.md#optional-logger)*

*Defined in [packages/sdk/base/src/task.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L20)*

Logger function

___

###  maxAttemps

• **maxAttemps**: *number*

*Defined in [packages/sdk/base/src/task.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L123)*

Maximum number of attemps

___

###  name

• **name**: *string*

*Inherited from [TaskOptions](_task_.taskoptions.md).[name](_task_.taskoptions.md#name)*

*Defined in [packages/sdk/base/src/task.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L18)*

Name for the task. To be used in logging messages

___

###  timeInBetweenMS

• **timeInBetweenMS**: *number*

*Defined in [packages/sdk/base/src/task.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L121)*

seconds between repetition

___

###  tryGetValue

• **tryGetValue**: *function*

*Defined in [packages/sdk/base/src/task.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L125)*

Function that tries to obtain a value A or returns null

#### Type declaration:

▸ (): *Promise‹A | null›*
