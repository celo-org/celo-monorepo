[@celo/base](../README.md) › ["task"](../modules/_task_.md) › [RunningTaskWithValue](_task_.runningtaskwithvalue.md)

# Interface: RunningTaskWithValue <**A**>

## Type parameters

▪ **A**

## Hierarchy

* [RunningTask](_task_.runningtask.md)

  ↳ **RunningTaskWithValue**

## Index

### Methods

* [isRunning](_task_.runningtaskwithvalue.md#isrunning)
* [onValue](_task_.runningtaskwithvalue.md#onvalue)
* [stop](_task_.runningtaskwithvalue.md#stop)

## Methods

###  isRunning

▸ **isRunning**(): *boolean*

*Inherited from [RunningTask](_task_.runningtask.md).[isRunning](_task_.runningtask.md#isrunning)*

*Defined in [packages/sdk/base/src/task.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L13)*

Indicates wether the task is running

**Returns:** *boolean*

___

###  onValue

▸ **onValue**(): *Promise‹A›*

*Defined in [packages/sdk/base/src/task.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L116)*

**Returns:** *Promise‹A›*

___

###  stop

▸ **stop**(): *void*

*Inherited from [RunningTask](_task_.runningtask.md).[stop](_task_.runningtask.md#stop)*

*Defined in [packages/sdk/base/src/task.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L11)*

Flag task to be stopped. Might not be inmediate

**Returns:** *void*
