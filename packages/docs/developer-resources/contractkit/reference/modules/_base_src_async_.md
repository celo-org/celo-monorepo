# External module: "base/src/async"

## Index

### Functions

* [concurrentMap](_base_src_async_.md#concurrentmap)
* [concurrentValuesMap](_base_src_async_.md#concurrentvaluesmap)
* [retryAsync](_base_src_async_.md#const-retryasync)
* [retryAsyncWithBackOff](_base_src_async_.md#const-retryasyncwithbackoff)
* [selectiveRetryAsyncWithBackOff](_base_src_async_.md#const-selectiveretryasyncwithbackoff)
* [sleep](_base_src_async_.md#sleep)

## Functions

###  concurrentMap

▸ **concurrentMap**<**A**, **B**>(`concurrency`: number, `xs`: A[], `mapFn`: function): *Promise‹B[]›*

*Defined in [packages/base/src/async.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L95)*

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

*Defined in [packages/base/src/async.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L117)*

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

▸ **retryAsync**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number): *Promise‹U›*

*Defined in [packages/base/src/async.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L12)*

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

**Returns:** *Promise‹U›*

___

### `Const` retryAsyncWithBackOff

▸ **retryAsyncWithBackOff**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number, `factor`: number): *Promise‹U›*

*Defined in [packages/base/src/async.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L35)*

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

**Returns:** *Promise‹U›*

___

### `Const` selectiveRetryAsyncWithBackOff

▸ **selectiveRetryAsyncWithBackOff**<**T**, **U**>(`inFunction`: InFunction‹T, U›, `tries`: number, `dontRetry`: string[], `params`: T, `delay`: number, `factor`: number): *Promise‹U›*

*Defined in [packages/base/src/async.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L60)*

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

**Returns:** *Promise‹U›*

___

###  sleep

▸ **sleep**(`ms`: number): *Promise‹void›*

*Defined in [packages/base/src/async.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/async.ts#L4)*

Sleep for a number of milliseconds

**Parameters:**

Name | Type |
------ | ------ |
`ms` | number |

**Returns:** *Promise‹void›*
