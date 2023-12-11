[@celo/base](../README.md) › ["result"](../modules/_result_.md) › [RootError](_result_.rooterror.md)

# Class: RootError ‹**T**›

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

###  constructor

\+ **new RootError**(`errorType`: T): *[RootError](_result_.rooterror.md)*

*Defined in [packages/sdk/base/src/result.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/result.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`errorType` | T |

**Returns:** *[RootError](_result_.rooterror.md)*

## Properties

### `Readonly` errorType

• **errorType**: *T*

*Implementation of [BaseError](../interfaces/_result_.baseerror.md).[errorType](../interfaces/_result_.baseerror.md#errortype)*

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

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typescript/lib/lib.es5.d.ts:1039
