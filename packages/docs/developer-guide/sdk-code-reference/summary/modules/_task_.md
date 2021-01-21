# task

## Index

### Interfaces

* [RepeatTaskContext]()
* [RetryTaskOptions]()
* [RunningTask]()
* [RunningTaskWithValue]()
* [TaskOptions]()

### Functions

* [conditionWatcher](_task_.md#conditionwatcher)
* [repeatTask](_task_.md#repeattask)
* [tryObtainValueWithRetries](_task_.md#tryobtainvaluewithretries)

## Functions

### conditionWatcher

▸ **conditionWatcher**\(`opts`: RepeatTaskOptions & object\): [_RunningTask_]()

_Defined in_ [_packages/sdk/base/src/task.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L100)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `opts` | RepeatTaskOptions & object |

**Returns:** [_RunningTask_]()

### repeatTask

▸ **repeatTask**\(`opts`: RepeatTaskOptions, `fn`: function\): [_RunningTask_]()

_Defined in_ [_packages/sdk/base/src/task.ts:54_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L54)

Runs an async function eternally until stopped

**Parameters:**

▪ **opts**: _RepeatTaskOptions_

▪ **fn**: _function_

function to run

▸ \(`ctx`: [RepeatTaskContext]()\): _Promise‹void›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ctx` | [RepeatTaskContext]() |

**Returns:** [_RunningTask_]()

### tryObtainValueWithRetries

▸ **tryObtainValueWithRetries**&lt;**A**&gt;\(`opts`: [RetryTaskOptions]()‹A›\): [_RunningTaskWithValue_]()_‹A›_

_Defined in_ [_packages/sdk/base/src/task.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/task.ts#L128)

**Type parameters:**

▪ **A**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `opts` | [RetryTaskOptions]()‹A› |

**Returns:** [_RunningTaskWithValue_]()_‹A›_

