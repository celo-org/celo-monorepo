# async

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

### concurrentMap

▸ **concurrentMap**&lt;**A**, **B**&gt;\(`concurrency`: number, `xs`: A\[\], `mapFn`: function\): _Promise‹B\[\]›_

_Defined in_ [_packages/sdk/base/src/async.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L128)

Map an async function over a list xs with a given concurrency level

**Type parameters:**

▪ **A**

▪ **B**

**Parameters:**

▪ **concurrency**: _number_

number of `mapFn` concurrent executions

▪ **xs**: _A\[\]_

list of value

▪ **mapFn**: _function_

mapping function

▸ \(`val`: A, `idx`: number\): _Promise‹B›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `val` | A |
| `idx` | number |

**Returns:** _Promise‹B\[\]›_

### concurrentValuesMap

▸ **concurrentValuesMap**&lt;**IN**, **OUT**&gt;\(`concurrency`: number, `x`: Record‹string, IN›, `mapFn`: function\): _Promise‹Record‹string, OUT››_

_Defined in_ [_packages/sdk/base/src/async.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L150)

Map an async function over the values in Object x with a given concurrency level

**Type parameters:**

▪ **IN**: _any_

▪ **OUT**: _any_

**Parameters:**

▪ **concurrency**: _number_

number of `mapFn` concurrent executions

▪ **x**: _Record‹string, IN›_

associative array of values

▪ **mapFn**: _function_

mapping function

▸ \(`val`: IN, `key`: string\): _Promise‹OUT›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `val` | IN |
| `key` | string |

**Returns:** _Promise‹Record‹string, OUT››_

### `Const` retryAsync

▸ **retryAsync**&lt;**T**, **U**&gt;\(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number, `logger`: [Logger](_logger_.md#logger) \| null\): _Promise‹U›_

_Defined in_ [_packages/sdk/base/src/async.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L14)

**Type parameters:**

▪ **T**: _any\[\]_

▪ **U**

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `inFunction` | InFunction‹T, U› | - |
| `tries` | number | - |
| `params` | T | - |
| `delay` | number | 100 |
| `logger` | [Logger](_logger_.md#logger) \| null | null |

**Returns:** _Promise‹U›_

### `Const` retryAsyncWithBackOff

▸ **retryAsyncWithBackOff**&lt;**T**, **U**&gt;\(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delay`: number, `factor`: number, `logger`: [Logger](_logger_.md#logger) \| null\): _Promise‹U›_

_Defined in_ [_packages/sdk/base/src/async.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L40)

**Type parameters:**

▪ **T**: _any\[\]_

▪ **U**

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `inFunction` | InFunction‹T, U› | - |
| `tries` | number | - |
| `params` | T | - |
| `delay` | number | 100 |
| `factor` | number | 1.5 |
| `logger` | [Logger](_logger_.md#logger) \| null | null |

**Returns:** _Promise‹U›_

### `Const` retryAsyncWithBackOffAndTimeout

▸ **retryAsyncWithBackOffAndTimeout**&lt;**T**, **U**&gt;\(`inFunction`: InFunction‹T, U›, `tries`: number, `params`: T, `delayMs`: number, `factor`: number, `timeoutMs`: number, `logger`: [Logger](_logger_.md#logger) \| null\): _Promise‹U›_

_Defined in_ [_packages/sdk/base/src/async.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L102)

**Type parameters:**

▪ **T**: _any\[\]_

▪ **U**

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `inFunction` | InFunction‹T, U› | - |
| `tries` | number | - |
| `params` | T | - |
| `delayMs` | number | 100 |
| `factor` | number | 1.5 |
| `timeoutMs` | number | 2000 |
| `logger` | [Logger](_logger_.md#logger) \| null | null |

**Returns:** _Promise‹U›_

### `Const` selectiveRetryAsyncWithBackOff

▸ **selectiveRetryAsyncWithBackOff**&lt;**T**, **U**&gt;\(`inFunction`: InFunction‹T, U›, `tries`: number, `dontRetry`: string\[\], `params`: T, `delay`: number, `factor`: number, `logger`: [Logger](_logger_.md#logger) \| null\): _Promise‹U›_

_Defined in_ [_packages/sdk/base/src/async.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L68)

**Type parameters:**

▪ **T**: _any\[\]_

▪ **U**

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `inFunction` | InFunction‹T, U› | - |
| `tries` | number | - |
| `dontRetry` | string\[\] | - |
| `params` | T | - |
| `delay` | number | 100 |
| `factor` | number | 1.5 |
| `logger` | [Logger](_logger_.md#logger) \| null | null |

**Returns:** _Promise‹U›_

### sleep

▸ **sleep**\(`ms`: number\): _Promise‹void›_

_Defined in_ [_packages/sdk/base/src/async.ts:6_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L6)

Sleep for a number of milliseconds

**Parameters:**

| Name | Type |
| :--- | :--- |
| `ms` | number |

**Returns:** _Promise‹void›_

### `Const` timeout

▸ **timeout**&lt;**T**, **U**&gt;\(`inFunction`: InFunction‹T, U›, `params`: T, `timeoutMs`: number, `timeoutError`: any, `timeoutLogMsg`: string \| null, `logger`: [Logger](_logger_.md#logger) \| null\): _Promise‹U›_

_Defined in_ [_packages/sdk/base/src/async.ts:173_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/async.ts#L173)

Wraps an async function in a timeout before calling it.

**Type parameters:**

▪ **T**: _any\[\]_

▪ **U**

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `inFunction` | InFunction‹T, U› | - | The async function to call |
| `params` | T | - | The parameters of the async function |
| `timeoutMs` | number | - | The timeout in milliseconds |
| `timeoutError` | any | - | The value to which the returned Promise should reject to |
| `timeoutLogMsg` | string \| null | null | - |
| `logger` | [Logger](_logger_.md#logger) \| null | null | - |

**Returns:** _Promise‹U›_

