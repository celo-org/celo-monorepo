[@celo/base](../README.md) › ["task"](_task_.md)

# Module: "task"

## Index

### Interfaces

* [RepeatTaskContext](../interfaces/_task_.repeattaskcontext.md)
* [RetryTaskOptions](../interfaces/_task_.retrytaskoptions.md)
* [RunningTask](../interfaces/_task_.runningtask.md)
* [RunningTaskWithValue](../interfaces/_task_.runningtaskwithvalue.md)
* [TaskOptions](../interfaces/_task_.taskoptions.md)

### Functions

* [conditionWatcher](_task_.md#conditionwatcher)
* [repeatTask](_task_.md#repeattask)
* [tryObtainValueWithRetries](_task_.md#tryobtainvaluewithretries)

## Functions

###  conditionWatcher

▸ **conditionWatcher**(`opts`: RepeatTaskOptions & object): *[RunningTask](../interfaces/_task_.runningtask.md)*

*Defined in [packages/sdk/base/src/task.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`opts` | RepeatTaskOptions & object |

**Returns:** *[RunningTask](../interfaces/_task_.runningtask.md)*

___

###  repeatTask

▸ **repeatTask**(`opts`: RepeatTaskOptions, `fn`: function): *[RunningTask](../interfaces/_task_.runningtask.md)*

*Defined in [packages/sdk/base/src/task.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L54)*

Runs an async function eternally until stopped

**Parameters:**

▪ **opts**: *RepeatTaskOptions*

▪ **fn**: *function*

function to run

▸ (`ctx`: [RepeatTaskContext](../interfaces/_task_.repeattaskcontext.md)): *Promise‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`ctx` | [RepeatTaskContext](../interfaces/_task_.repeattaskcontext.md) |

**Returns:** *[RunningTask](../interfaces/_task_.runningtask.md)*

___

###  tryObtainValueWithRetries

▸ **tryObtainValueWithRetries**‹**A**›(`opts`: [RetryTaskOptions](../interfaces/_task_.retrytaskoptions.md)‹A›): *[RunningTaskWithValue](../interfaces/_task_.runningtaskwithvalue.md)‹A›*

*Defined in [packages/sdk/base/src/task.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L128)*

**Type parameters:**

▪ **A**

**Parameters:**

Name | Type |
------ | ------ |
`opts` | [RetryTaskOptions](../interfaces/_task_.retrytaskoptions.md)‹A› |

**Returns:** *[RunningTaskWithValue](../interfaces/_task_.runningtaskwithvalue.md)‹A›*
