[@celo/base](../README.md) › ["async"](_async_.md)

# Module: "async"

## Index

### Functions

* [concurrentMap](_async_.md#concurrentmap)
* [concurrentValuesMap](_async_.md#concurrentvaluesmap)
* [retryAsync](_async_.md#const-retryasync)
* [retryAsyncWithBackOff](_async_.md#const-retryasyncwithbackoff)
* [retryAsyncWithBackOffAndTimeout](_async_.md#const-retryasyncwithbackoffandtimeout)
* [selectiveRetryAsyncWithBackOff](_async_.md#const-selectiveretryasyncwithbackoff)
* [sleep](_async_.md#sleep)
* [timeout](_async_.md#const-timeout)

## Functions

###  concurrentMap

▸ **concurrentMap**<**A**, **B**>(`concurrency`: number, `xs`: A[], `mapFn`: function): *Promise‹B[]›*

*Defined in [packages/sdk/base/src/async.ts:128](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L128)*

Map an async function over a list xs with a given concurrency level

**Type parameters:**

▪ **A**

▪ **B**

**Parameters:**

▪ **concurrency**: *number*

number of `mapFn` concurrent executions

▪ **xs**: *A[]*

list of value

▪ **mapFn**: *function*

mapping function

▸ (`val`: A, `idx`: number): *Promise‹B›*

**Parameters:**

Name | Type |
------ | ------ |
`val` | A |
`idx` | number |

**Returns:** *Promise‹B[]›*

___

###  concurrentValuesMap

▸ **concurrentValuesMap**<**IN**, **OUT**>(`concurrency`: number, `x`: Record‹string, IN›, `mapFn`: function): *Promise‹Record‹string, OUT››*

*Defined in [packages/sdk/base/src/async.ts:150](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L150)*

Map an async function over the values in Object x with a given concurrency level

**Type parameters:**

▪ **IN**: *any*

▪ **OUT**: *any*

**Parameters:**

▪ **concurrency**: *number*

number of `mapFn` concurrent executions

▪ **x**: *Record‹string, IN›*

associative array of values

▪ **mapFn**: *function*

mapping function

▸ (`val`: IN, `key`: string): *Promise‹OUT›*

**Parameters:**

Name | Type |
------ | ------ |
`val` | IN |
`key` | string |

**Returns:** *Promise‹Record‹string, OUT››*

___

### `Const` retryAsync

▸ **retryAsync**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number, `logger`: [Logger](_logger_.md#logger) | null): *Promise‹U›*

*Defined in [packages/sdk/base/src/async.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L14)*

**Type parameters:**

▪ **T**: *any[]*

▪ **U**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`inFunction` | InFunction‹T, U› | - |
`tries` | number | - |
`params` | T | - |
`delay` | number | 100 |
`logger` | [Logger](_logger_.md#logger) &#124; null | null |

**Returns:** *Promise‹U›*

___

### `Const` retryAsyncWithBackOff

▸ **retryAsyncWithBackOff**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number, `factor`: number, `logger`: [Logger](_logger_.md#logger) | null): *Promise‹U›*

*Defined in [packages/sdk/base/src/async.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L40)*

**Type parameters:**

▪ **T**: *any[]*

▪ **U**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`inFunction` | InFunction‹T, U› | - |
`tries` | number | - |
`params` | T | - |
`delay` | number | 100 |
`factor` | number | 1.5 |
`logger` | [Logger](_logger_.md#logger) &#124; null | null |

**Returns:** *Promise‹U›*

___

### `Const` retryAsyncWithBackOffAndTimeout

▸ **retryAsyncWithBackOffAndTimeout**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delayMs`: number, `factor`: number, `timeoutMs`: number, `logger`: [Logger](_logger_.md#logger) | null): *Promise‹U›*

*Defined in [packages/sdk/base/src/async.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L102)*

**Type parameters:**

▪ **T**: *any[]*

▪ **U**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`inFunction` | InFunction‹T, U› | - |
`tries` | number | - |
`params` | T | - |
`delayMs` | number | 100 |
`factor` | number | 1.5 |
`timeoutMs` | number | 2000 |
`logger` | [Logger](_logger_.md#logger) &#124; null | null |

**Returns:** *Promise‹U›*

___

### `Const` selectiveRetryAsyncWithBackOff

▸ **selectiveRetryAsyncWithBackOff**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `dontRetry`: string[], `params`: T, `delay`: number, `factor`: number, `logger`: [Logger](_logger_.md#logger) | null): *Promise‹U›*

*Defined in [packages/sdk/base/src/async.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L68)*

**Type parameters:**

▪ **T**: *any[]*

▪ **U**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`inFunction` | InFunction‹T, U› | - |
`tries` | number | - |
`dontRetry` | string[] | - |
`params` | T | - |
`delay` | number | 100 |
`factor` | number | 1.5 |
`logger` | [Logger](_logger_.md#logger) &#124; null | null |

**Returns:** *Promise‹U›*

___

###  sleep

▸ **sleep**(`ms`: number): *Promise‹void›*

*Defined in [packages/sdk/base/src/async.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L6)*

Sleep for a number of milliseconds

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *Promise‹void›*

___

### `Const` timeout

▸ **timeout**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `params`: T, `timeoutMs`: number, `timeoutError`: any, `timeoutLogMsg`: string | null, `logger`: [Logger](_logger_.md#logger) | null): *Promise‹U›*

*Defined in [packages/sdk/base/src/async.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L173)*

Wraps an async function in a timeout before calling it.

**Type parameters:**

▪ **T**: *any[]*

▪ **U**

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`inFunction` | InFunction‹T, U› | - | The async function to call |
`params` | T | - | The parameters of the async function |
`timeoutMs` | number | - | The timeout in milliseconds |
`timeoutError` | any | - | The value to which the returned Promise should reject to  |
`timeoutLogMsg` | string &#124; null | null | - |
`logger` | [Logger](_logger_.md#logger) &#124; null | null | - |

**Returns:** *Promise‹U›*
