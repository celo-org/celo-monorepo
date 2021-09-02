# result

## Index

### Classes

* [JSONParseError]()
* [RootError]()

### Interfaces

* [BaseError]()
* [ErrorResult]()
* [OkResult]()

### Type aliases

* [Result](_result_.md#result)

### Variables

* [JSONParseErrorType](_result_.md#const-jsonparseerrortype)

### Functions

* [Err](_result_.md#const-err)
* [Ok](_result_.md#const-ok)
* [makeAsyncThrowable](_result_.md#makeasyncthrowable)
* [makeThrowable](_result_.md#makethrowable)
* [parseJsonAsResult](_result_.md#parsejsonasresult)
* [throwIfError](_result_.md#throwiferror)

## Type aliases

### Result

Ƭ **Result**: [_OkResult_]()_‹TResult› \|_ [_ErrorResult_]()_‹TError›_

_Defined in_ [_packages/sdk/base/src/result.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L10)

## Variables

### `Const` JSONParseErrorType

• **JSONParseErrorType**: _"JsonParseError"_ = "JsonParseError"

_Defined in_ [_packages/sdk/base/src/result.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L77)

## Functions

### `Const` Err

▸ **Err**&lt;**TError**&gt;\(`error`: TError\): [_ErrorResult_]()_‹TError›_

_Defined in_ [_packages/sdk/base/src/result.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L16)

**Type parameters:**

▪ **TError**: [_Error_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | TError |

**Returns:** [_ErrorResult_]()_‹TError›_

### `Const` Ok

▸ **Ok**&lt;**TResult**&gt;\(`result`: TResult\): [_OkResult_]()_‹TResult›_

_Defined in_ [_packages/sdk/base/src/result.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L12)

**Type parameters:**

▪ **TResult**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `result` | TResult |

**Returns:** [_OkResult_]()_‹TResult›_

### makeAsyncThrowable

▸ **makeAsyncThrowable**&lt;**TArgs**, **TResult**, **TError**, **TModifiedError**&gt;\(`f`: function, `errorModifier?`: undefined \| function\): _\(Anonymous function\)_

_Defined in_ [_packages/sdk/base/src/result.ts:47_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L47)

**Type parameters:**

▪ **TArgs**: _any\[\]_

▪ **TResult**

▪ **TError**: [_Error_]()

▪ **TModifiedError**: [_Error_]()

**Parameters:**

▪ **f**: _function_

▸ \(...`args`: TArgs\): _Promise‹_[_Result_](_result_.md#result)_‹TResult, TError››_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

▪`Optional` **errorModifier**: _undefined \| function_

**Returns:** _\(Anonymous function\)_

### makeThrowable

▸ **makeThrowable**&lt;**TArgs**, **TResult**, **TError**, **TModifiedError**&gt;\(`f`: function, `errorModifier?`: undefined \| function\): _\(Anonymous function\)_

_Defined in_ [_packages/sdk/base/src/result.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L35)

**Type parameters:**

▪ **TArgs**: _any\[\]_

▪ **TResult**

▪ **TError**: [_Error_]()

▪ **TModifiedError**: [_Error_]()

**Parameters:**

▪ **f**: _function_

▸ \(...`args`: TArgs\): [_Result_](_result_.md#result)_‹TResult, TError›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `...args` | TArgs |

▪`Optional` **errorModifier**: _undefined \| function_

**Returns:** _\(Anonymous function\)_

### parseJsonAsResult

▸ **parseJsonAsResult**\(`data`: string\): [_OkResult_]()_‹any› \|_ [_ErrorResult_]()_‹_[_JSONParseError_]()_‹››_

_Defined in_ [_packages/sdk/base/src/result.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L84)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `data` | string |

**Returns:** [_OkResult_]()_‹any› \|_ [_ErrorResult_]()_‹_[_JSONParseError_]()_‹››_

### throwIfError

▸ **throwIfError**&lt;**TResult**, **TError**, **TModifiedError**&gt;\(`result`: [Result](_result_.md#result)‹TResult, TError›, `errorModifier?`: undefined \| function\): _TResult_

_Defined in_ [_packages/sdk/base/src/result.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L21)

**Type parameters:**

▪ **TResult**

▪ **TError**: [_Error_]()

▪ **TModifiedError**: [_Error_]()

**Parameters:**

| Name | Type |
| :--- | :--- |
| `result` | [Result](_result_.md#result)‹TResult, TError› |
| `errorModifier?` | undefined \| function |

**Returns:** _TResult_

