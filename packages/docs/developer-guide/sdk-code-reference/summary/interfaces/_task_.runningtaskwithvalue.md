# RunningTaskWithValue

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

### isRunning

▸ **isRunning**\(\): _boolean_

_Inherited from_ [_RunningTask_](_task_.runningtask.md)_._[_isRunning_](_task_.runningtask.md#isrunning)

_Defined in_ [_packages/sdk/base/src/task.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L13)

Indicates wether the task is running

**Returns:** _boolean_

### onValue

▸ **onValue**\(\): _Promise‹A›_

_Defined in_ [_packages/sdk/base/src/task.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L116)

**Returns:** _Promise‹A›_

### stop

▸ **stop**\(\): _void_

_Inherited from_ [_RunningTask_](_task_.runningtask.md)_._[_stop_](_task_.runningtask.md#stop)

_Defined in_ [_packages/sdk/base/src/task.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L11)

Flag task to be stopped. Might not be inmediate

**Returns:** _void_

