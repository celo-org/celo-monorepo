# Interface: RunningTask

Represent a running task that can be stopped

Examples: A poller, a watcher.

## Hierarchy

* **RunningTask**

  ↳ [RunningTaskWithValue](_base_src_task_.runningtaskwithvalue.md)

## Index

### Methods

* [isRunning](_base_src_task_.runningtask.md#isrunning)
* [stop](_base_src_task_.runningtask.md#stop)

## Methods

###  isRunning

▸ **isRunning**(): *boolean*

*Defined in [packages/base/src/task.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L13)*

Indicates wether the task is running

**Returns:** *boolean*

___

###  stop

▸ **stop**(): *void*

*Defined in [packages/base/src/task.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L11)*

Flag task to be stopped. Might not be inmediate

**Returns:** *void*
