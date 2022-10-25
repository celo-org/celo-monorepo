[@celo/base](../README.md) › ["result"](../modules/_result_.md) › [JSONParseError](_result_.jsonparseerror.md)

# Class: JSONParseError

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

###  constructor

\+ **new JSONParseError**(`error`: [Error](_result_.rooterror.md#static-error)): *[JSONParseError](_result_.jsonparseerror.md)*

*Overrides [RootError](_result_.rooterror.md).[constructor](_result_.rooterror.md#constructor)*

*Defined in [packages/sdk/base/src/result.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](_result_.rooterror.md#static-error) |

**Returns:** *[JSONParseError](_result_.jsonparseerror.md)*

## Properties

### `Readonly` error

• **error**: *[Error](_result_.rooterror.md#static-error)*

*Defined in [packages/sdk/base/src/result.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L80)*

___

### `Readonly` errorType

• **errorType**: *string*

*Implementation of [BaseError](../interfaces/_result_.baseerror.md).[errorType](../interfaces/_result_.baseerror.md#errortype)*

*Inherited from [RootError](_result_.rooterror.md).[errorType](_result_.rooterror.md#readonly-errortype)*

*Defined in [packages/sdk/base/src/result.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L67)*

___

###  message

• **message**: *string*

*Inherited from [RootError](_result_.rooterror.md).[message](_result_.rooterror.md#message)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:1029

___

###  name

• **name**: *string*

*Inherited from [RootError](_result_.rooterror.md).[name](_result_.rooterror.md#name)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:1028

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [RootError](_result_.rooterror.md).[stack](_result_.rooterror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:1030
