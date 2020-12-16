# Module: "result"

## Index

### Classes

* [JSONParseError](../classes/_result_.jsonparseerror.md)
* [RootError](../classes/_result_.rooterror.md)

### Interfaces

* [BaseError](../interfaces/_result_.baseerror.md)
* [ErrorResult](../interfaces/_result_.errorresult.md)
* [OkResult](../interfaces/_result_.okresult.md)

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

###  Result

Ƭ **Result**: *[OkResult](../interfaces/_result_.okresult.md)‹TResult› | [ErrorResult](../interfaces/_result_.errorresult.md)‹TError›*

*Defined in [packages/sdk/base/src/result.ts:10](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L10)*

## Variables

### `Const` JSONParseErrorType

• **JSONParseErrorType**: *"JsonParseError"* = "JsonParseError"

*Defined in [packages/sdk/base/src/result.ts:77](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L77)*

## Functions

### `Const` Err

▸ **Err**<**TError**>(`error`: TError): *[ErrorResult](../interfaces/_result_.errorresult.md)‹TError›*

*Defined in [packages/sdk/base/src/result.ts:16](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L16)*

**Type parameters:**

▪ **TError**: *[Error](../classes/_result_.rooterror.md#static-error)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | TError |

**Returns:** *[ErrorResult](../interfaces/_result_.errorresult.md)‹TError›*

___

### `Const` Ok

▸ **Ok**<**TResult**>(`result`: TResult): *[OkResult](../interfaces/_result_.okresult.md)‹TResult›*

*Defined in [packages/sdk/base/src/result.ts:12](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L12)*

**Type parameters:**

▪ **TResult**

**Parameters:**

Name | Type |
------ | ------ |
`result` | TResult |

**Returns:** *[OkResult](../interfaces/_result_.okresult.md)‹TResult›*

___

###  makeAsyncThrowable

▸ **makeAsyncThrowable**<**TArgs**, **TResult**, **TError**, **TModifiedError**>(`f`: function, `errorModifier?`: undefined | function): *(Anonymous function)*

*Defined in [packages/sdk/base/src/result.ts:47](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L47)*

**Type parameters:**

▪ **TArgs**: *any[]*

▪ **TResult**

▪ **TError**: *[Error](../classes/_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_result_.rooterror.md#static-error)*

**Parameters:**

▪ **f**: *function*

▸ (...`args`: TArgs): *Promise‹[Result](_result_.md#result)‹TResult, TError››*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

▪`Optional`  **errorModifier**: *undefined | function*

**Returns:** *(Anonymous function)*

___

###  makeThrowable

▸ **makeThrowable**<**TArgs**, **TResult**, **TError**, **TModifiedError**>(`f`: function, `errorModifier?`: undefined | function): *(Anonymous function)*

*Defined in [packages/sdk/base/src/result.ts:35](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L35)*

**Type parameters:**

▪ **TArgs**: *any[]*

▪ **TResult**

▪ **TError**: *[Error](../classes/_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_result_.rooterror.md#static-error)*

**Parameters:**

▪ **f**: *function*

▸ (...`args`: TArgs): *[Result](_result_.md#result)‹TResult, TError›*

**Parameters:**

Name | Type |
------ | ------ |
`...args` | TArgs |

▪`Optional`  **errorModifier**: *undefined | function*

**Returns:** *(Anonymous function)*

___

###  parseJsonAsResult

▸ **parseJsonAsResult**(`data`: string): *[OkResult](../interfaces/_result_.okresult.md)‹any› | [ErrorResult](../interfaces/_result_.errorresult.md)‹[JSONParseError](../classes/_result_.jsonparseerror.md)‹››*

*Defined in [packages/sdk/base/src/result.ts:84](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *[OkResult](../interfaces/_result_.okresult.md)‹any› | [ErrorResult](../interfaces/_result_.errorresult.md)‹[JSONParseError](../classes/_result_.jsonparseerror.md)‹››*

___

###  throwIfError

▸ **throwIfError**<**TResult**, **TError**, **TModifiedError**>(`result`: [Result](_result_.md#result)‹TResult, TError›, `errorModifier?`: undefined | function): *TResult*

*Defined in [packages/sdk/base/src/result.ts:21](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L21)*

**Type parameters:**

▪ **TResult**

▪ **TError**: *[Error](../classes/_result_.rooterror.md#static-error)*

▪ **TModifiedError**: *[Error](../classes/_result_.rooterror.md#static-error)*

**Parameters:**

Name | Type |
------ | ------ |
`result` | [Result](_result_.md#result)‹TResult, TError› |
`errorModifier?` | undefined &#124; function |

**Returns:** *TResult*
