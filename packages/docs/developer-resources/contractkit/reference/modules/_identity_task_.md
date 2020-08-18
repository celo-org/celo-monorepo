# External module: "identity/task"

## Index

### Enumerations

* [TaskStatus](../enums/_identity_task_.taskstatus.md)

### Classes

* [RootError](../classes/_identity_task_.rooterror.md)

### Interfaces

* [BaseError](../interfaces/_identity_task_.baseerror.md)
* [FailedTask](../interfaces/_identity_task_.failedtask.md)
* [OKTask](../interfaces/_identity_task_.oktask.md)

### Type aliases

* [Task](_identity_task_.md#task)

### Functions

* [Err](_identity_task_.md#const-err)
* [Ok](_identity_task_.md#const-ok)
* [isError](_identity_task_.md#iserror)
* [isResult](_identity_task_.md#isresult)

## Type aliases

###  Task

Ƭ **Task**: *[OKTask](../interfaces/_identity_task_.oktask.md)‹TResult› | [FailedTask](../interfaces/_identity_task_.failedtask.md)‹TError›*

*Defined in [packages/contractkit/src/identity/task.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L14)*

## Functions

### `Const` Err

▸ **Err**<**TError**>(`error`: TError): *[FailedTask](../interfaces/_identity_task_.failedtask.md)‹TError›*

*Defined in [packages/contractkit/src/identity/task.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L17)*

**Type parameters:**

▪ **TError**

**Parameters:**

Name | Type |
------ | ------ |
`error` | TError |

**Returns:** *[FailedTask](../interfaces/_identity_task_.failedtask.md)‹TError›*

___

### `Const` Ok

▸ **Ok**<**TResult**>(`result`: TResult): *[OKTask](../interfaces/_identity_task_.oktask.md)‹TResult›*

*Defined in [packages/contractkit/src/identity/task.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L16)*

**Type parameters:**

▪ **TResult**

**Parameters:**

Name | Type |
------ | ------ |
`result` | TResult |

**Returns:** *[OKTask](../interfaces/_identity_task_.oktask.md)‹TResult›*

___

###  isError

▸ **isError**<**TResult**, **TError**>(`task`: [Task](_identity_task_.md#task)‹TResult, TError›): *task is FailedTask<TError>*

*Defined in [packages/contractkit/src/identity/task.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L22)*

**Type parameters:**

▪ **TResult**

▪ **TError**

**Parameters:**

Name | Type |
------ | ------ |
`task` | [Task](_identity_task_.md#task)‹TResult, TError› |

**Returns:** *task is FailedTask<TError>*

___

###  isResult

▸ **isResult**<**TResult**, **TError**>(`task`: [Task](_identity_task_.md#task)‹TResult, TError›): *task is OKTask<TResult>*

*Defined in [packages/contractkit/src/identity/task.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/task.ts#L25)*

**Type parameters:**

▪ **TResult**

▪ **TError**

**Parameters:**

Name | Type |
------ | ------ |
`task` | [Task](_identity_task_.md#task)‹TResult, TError› |

**Returns:** *task is OKTask<TResult>*
