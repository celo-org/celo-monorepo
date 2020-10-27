# External module: "base/src/result"

## Index

### Classes

* [JSONParseError](../classes/_base_src_result_.jsonparseerror.md)
* [RootError](../classes/_base_src_result_.rooterror.md)

### Interfaces

* [BaseError](../interfaces/_base_src_result_.baseerror.md)
* [ErrorResult](../interfaces/_base_src_result_.errorresult.md)
* [OkResult](../interfaces/_base_src_result_.okresult.md)

### Type aliases

* [Result](_base_src_result_.md#result)

### Variables

* [JSONParseErrorType](_base_src_result_.md#const-jsonparseerrortype)

### Functions

* [Err](_base_src_result_.md#const-err)
* [Ok](_base_src_result_.md#const-ok)
* [makeAsyncThrowable](_base_src_result_.md#makeasyncthrowable)
* [makeThrowable](_base_src_result_.md#makethrowable)
* [parseJsonAsResult](_base_src_result_.md#parsejsonasresult)
* [throwIfError](_base_src_result_.md#throwiferror)

## Type aliases

###  Result

Ƭ **Result**: *[OkResult](../interfaces/_base_src_result_.okresult.md)‹TResult› | [ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹TError›*

*Defined in [packages/base/src/result.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L10)*

## Variables

### `Const` JSONParseErrorType

• **JSONParseErrorType**: *"JsonParseError"* = "JsonParseError"

*Defined in [packages/base/src/result.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L77)*

## Functions

### `Const` Err

▸ **Err**<**TError**>(`error`: TError): *[ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹TError›*

*Defined in [packages/base/src/result.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L16)*

**Type parameters:**

▪ **TError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | TError |

**Returns:** *[ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹TError›*

___

### `Const` Ok

▸ **Ok**<**TResult**>(`result`: TResult): *[OkResult](../interfaces/_base_src_result_.okresult.md)‹TResult›*

*Defined in [packages/base/src/result.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L12)*

**Type parameters:**

▪ **TResult**

**Parameters:**

Name | Type |
------ | ------ |
`result` | TResult |

**Returns:** *[OkResult](../interfaces/_base_src_result_.okresult.md)‹TResult›*

___

###  makeAsyncThrowable

▸ **makeAsyncThrowable**<**TArgs**, **TResult**, **TError**, **TModifiedError**>(`f`: function, `errorModifier?`: undefined | function): *(Anonymous function)*

*Defined in [packages/base/src/result.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L47)*

**Type parameters:**

▪ **TArgs**: *any[]*

▪ **TResult**

▪ **TError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

**Parameters:**

▪ **f**: *function*

▸ (...`args`: TArgs): *Promise‹[Result](_base_src_result_.md#result)‹TResult, TError››*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

▪`Optional`  **errorModifier**: *undefined | function*

**Returns:** *(Anonymous function)*

___

###  makeThrowable

▸ **makeThrowable**<**TArgs**, **TResult**, **TError**, **TModifiedError**>(`f`: function, `errorModifier?`: undefined | function): *(Anonymous function)*

*Defined in [packages/base/src/result.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L35)*

**Type parameters:**

▪ **TArgs**: *any[]*

▪ **TResult**

▪ **TError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

**Parameters:**

▪ **f**: *function*

▸ (...`args`: TArgs): *[Result](_base_src_result_.md#result)‹TResult, TError›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

▪`Optional`  **errorModifier**: *undefined | function*

**Returns:** *(Anonymous function)*

___

###  parseJsonAsResult

▸ **parseJsonAsResult**(`data`: string): *[OkResult](../interfaces/_base_src_result_.okresult.md)‹any› | [ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹[JSONParseError](../classes/_base_src_result_.jsonparseerror.md)‹››*

*Defined in [packages/base/src/result.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *[OkResult](../interfaces/_base_src_result_.okresult.md)‹any› | [ErrorResult](../interfaces/_base_src_result_.errorresult.md)‹[JSONParseError](../classes/_base_src_result_.jsonparseerror.md)‹››*

___

###  throwIfError

▸ **throwIfError**<**TResult**, **TError**, **TModifiedError**>(`result`: [Result](_base_src_result_.md#result)‹TResult, TError›, `errorModifier?`: undefined | function): *TResult*

*Defined in [packages/base/src/result.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L21)*

**Type parameters:**

▪ **TResult**

▪ **TError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_base_src_result_.rooterror.md#static-error)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | [Result](_base_src_result_.md#result)‹TResult, TError› |
`errorModifier?` | undefined &#124; function |

**Returns:** *TResult*
