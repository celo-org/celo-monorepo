# Interface: RetryTaskOptions <**A**>

## Type parameters

▪ **A**

## Hierarchy

* [TaskOptions](_base_src_task_.taskoptions.md)

  ↳ **RetryTaskOptions**

## Index

### Properties

* [logger](_base_src_task_.retrytaskoptions.md#optional-logger)
* [maxAttemps](_base_src_task_.retrytaskoptions.md#maxattemps)
* [name](_base_src_task_.retrytaskoptions.md#name)
* [timeInBetweenMS](_base_src_task_.retrytaskoptions.md#timeinbetweenms)
* [tryGetValue](_base_src_task_.retrytaskoptions.md#trygetvalue)

## Properties

### `Optional` logger

• **logger**? : *[Logger](../modules/_base_src_logger_.md#logger)*

*Inherited from [TaskOptions](_base_src_task_.taskoptions.md).[logger](_base_src_task_.taskoptions.md#optional-logger)*

*Defined in [packages/base/src/task.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L20)*

Logger function

___

###  maxAttemps

• **maxAttemps**: *number*

*Defined in [packages/base/src/task.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L123)*

Maximum number of attemps

___

###  name

• **name**: *string*

*Inherited from [TaskOptions](_base_src_task_.taskoptions.md).[name](_base_src_task_.taskoptions.md#name)*

*Defined in [packages/base/src/task.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L18)*

Name for the task. To be used in logging messages

___

###  timeInBetweenMS

• **timeInBetweenMS**: *number*

*Defined in [packages/base/src/task.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L121)*

seconds between repetition

___

###  tryGetValue

• **tryGetValue**: *function*

*Defined in [packages/base/src/task.ts:125](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L125)*

Function that tries to obtain a value A or returns null

#### Type declaration:

▸ (): *Promise‹A | null›*
