# RootError

## Type parameters

▪ **T**

## Hierarchy

* [Error](_result_.rooterror.md#static-error)

  ↳ **RootError**

  ↳ [JSONParseError](_result_.jsonparseerror.md)

## Implements

* [BaseError](../interfaces/_result_.baseerror.md)‹T›

## Index

### Constructors

* [constructor](_result_.rooterror.md#constructor)

### Properties

* [errorType](_result_.rooterror.md#readonly-errortype)
* [message](_result_.rooterror.md#message)
* [name](_result_.rooterror.md#name)
* [stack](_result_.rooterror.md#optional-stack)
* [Error](_result_.rooterror.md#static-error)

## Constructors

### constructor

+ **new RootError**\(`errorType`: T\): [_RootError_](_result_.rooterror.md)

_Defined in_ [_packages/sdk/base/src/result.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L66)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `errorType` | T |

**Returns:** [_RootError_](_result_.rooterror.md)

## Properties

### `Readonly` errorType

• **errorType**: _T_

_Implementation of_ [_BaseError_](../interfaces/_result_.baseerror.md)_._[_errorType_](../interfaces/_result_.baseerror.md#errortype)

_Defined in_ [_packages/sdk/base/src/result.ts:67_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L67)

### message

• **message**: _string_

_Inherited from_ [_RootError_](_result_.rooterror.md)_._[_message_](_result_.rooterror.md#message)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:974

### name

• **name**: _string_

_Inherited from_ [_RootError_](_result_.rooterror.md)_._[_name_](_result_.rooterror.md#name)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:973

### `Optional` stack

• **stack**? : _undefined \| string_

_Inherited from_ [_RootError_](_result_.rooterror.md)_._[_stack_](_result_.rooterror.md#optional-stack)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:975

### `Static` Error

▪ **Error**: _ErrorConstructor_

Defined in node\_modules/typescript/lib/lib.es5.d.ts:984

