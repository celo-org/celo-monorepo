# RunningTask

Represent a running task that can be stopped

Examples: A poller, a watcher.

## Hierarchy

* **RunningTask**

  ↳ [RunningTaskWithValue](_task_.runningtaskwithvalue.md)

## Index

### Methods

* [isRunning](_task_.runningtask.md#isrunning)
* [stop](_task_.runningtask.md#stop)

## Methods

### isRunning

▸ **isRunning**\(\): _boolean_

_Defined in_ [_packages/sdk/base/src/task.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L13)

Indicates wether the task is running

**Returns:** _boolean_

### stop

▸ **stop**\(\): _void_

_Defined in_ [_packages/sdk/base/src/task.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L11)

Flag task to be stopped. Might not be inmediate

**Returns:** _void_

