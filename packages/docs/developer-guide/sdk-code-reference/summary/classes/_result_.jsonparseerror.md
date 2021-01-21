# JSONParseError

## Hierarchy

↳ [RootError](_result_.rooterror.md)‹string›

↳ **JSONParseError**

## Implements

* [BaseError](../interfaces/_result_.baseerror.md)‹string›

## Index

### Constructors

* [constructor](_result_.jsonparseerror.md#constructor)

### Properties

* [error](_result_.jsonparseerror.md#readonly-error)
* [errorType](_result_.jsonparseerror.md#readonly-errortype)
* [message](_result_.jsonparseerror.md#message)
* [name](_result_.jsonparseerror.md#name)
* [stack](_result_.jsonparseerror.md#optional-stack)

## Constructors

### constructor

+ **new JSONParseError**\(`error`: [Error](_result_.rooterror.md#static-error)\): [_JSONParseError_](_result_.jsonparseerror.md)

_Overrides_ [_RootError_](_result_.rooterror.md)_._[_constructor_](_result_.rooterror.md#constructor)

_Defined in_ [_packages/sdk/base/src/result.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L79)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | [Error](_result_.rooterror.md#static-error) |

**Returns:** [_JSONParseError_](_result_.jsonparseerror.md)

## Properties

### `Readonly` error

• **error**: [_Error_](_result_.rooterror.md#static-error)

_Defined in_ [_packages/sdk/base/src/result.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L80)

### `Readonly` errorType

• **errorType**: _string_

_Implementation of_ [_BaseError_](../interfaces/_result_.baseerror.md)_._[_errorType_](../interfaces/_result_.baseerror.md#errortype)

_Inherited from_ [_RootError_](_result_.rooterror.md)_._[_errorType_](_result_.rooterror.md#readonly-errortype)

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

