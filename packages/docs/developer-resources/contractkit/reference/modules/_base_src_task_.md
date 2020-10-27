# External module: "base/src/task"

## Index

### Interfaces

* [RepeatTaskContext](../interfaces/_base_src_task_.repeattaskcontext.md)
* [RetryTaskOptions](../interfaces/_base_src_task_.retrytaskoptions.md)
* [RunningTask](../interfaces/_base_src_task_.runningtask.md)
* [RunningTaskWithValue](../interfaces/_base_src_task_.runningtaskwithvalue.md)
* [TaskOptions](../interfaces/_base_src_task_.taskoptions.md)

### Functions

* [conditionWatcher](_base_src_task_.md#conditionwatcher)
* [repeatTask](_base_src_task_.md#repeattask)
* [tryObtainValueWithRetries](_base_src_task_.md#tryobtainvaluewithretries)

## Functions

###  conditionWatcher

▸ **conditionWatcher**(`opts`: RepeatTaskOptions & object): *[RunningTask](../interfaces/_base_src_task_.runningtask.md)*

*Defined in [packages/base/src/task.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | RepeatTaskOptions & object |

**Returns:** *[RunningTask](../interfaces/_base_src_task_.runningtask.md)*

___

###  repeatTask

▸ **repeatTask**(`opts`: RepeatTaskOptions, `fn`: function): *[RunningTask](../interfaces/_base_src_task_.runningtask.md)*

*Defined in [packages/base/src/task.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L54)*

Runs an async function eternally until stopped

**Parameters:**

▪ **opts**: *RepeatTaskOptions*

▪ **fn**: *function*

function to run

▸ (`ctx`: [RepeatTaskContext](../interfaces/_base_src_task_.repeattaskcontext.md)): *Promise‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`ctx` | [RepeatTaskContext](../interfaces/_base_src_task_.repeattaskcontext.md) |

**Returns:** *[RunningTask](../interfaces/_base_src_task_.runningtask.md)*

___

###  tryObtainValueWithRetries

▸ **tryObtainValueWithRetries**<**A**>(`opts`: [RetryTaskOptions](../interfaces/_base_src_task_.retrytaskoptions.md)‹A›): *[RunningTaskWithValue](../interfaces/_base_src_task_.runningtaskwithvalue.md)‹A›*

*Defined in [packages/base/src/task.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/task.ts#L128)*

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [RetryTaskOptions](../interfaces/_base_src_task_.retrytaskoptions.md)‹A› |

**Returns:** *[RunningTaskWithValue](../interfaces/_base_src_task_.runningtaskwithvalue.md)‹A›*
