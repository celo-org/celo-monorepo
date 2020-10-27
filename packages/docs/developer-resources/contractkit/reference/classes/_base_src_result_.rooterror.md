# Class: RootError <**T**>

## Type parameters

▪ **T**

## Hierarchy

* [Error](_base_src_result_.rooterror.md#static-error)

  ↳ **RootError**

  ↳ [JSONParseError](_base_src_result_.jsonparseerror.md)

## Implements

* [BaseError](../interfaces/_base_src_result_.baseerror.md)‹T›

## Index

### Constructors

* [constructor](_base_src_result_.rooterror.md#constructor)

### Properties

* [errorType](_base_src_result_.rooterror.md#errortype)
* [message](_base_src_result_.rooterror.md#message)
* [name](_base_src_result_.rooterror.md#name)
* [stack](_base_src_result_.rooterror.md#optional-stack)
* [Error](_base_src_result_.rooterror.md#static-error)

## Constructors

###  constructor

\+ **new RootError**(`errorType`: T): *[RootError](_base_src_result_.rooterror.md)*

*Defined in [packages/base/src/result.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`errorType` | T |

**Returns:** *[RootError](_base_src_result_.rooterror.md)*

## Properties

###  errorType

• **errorType**: *T*

*Implementation of [BaseError](../interfaces/_base_src_result_.baseerror.md).[errorType](../interfaces/_base_src_result_.baseerror.md#errortype)*

*Defined in [packages/base/src/result.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L67)*

___

###  message

• **message**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[message](_base_src_result_.rooterror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[name](_base_src_result_.rooterror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[stack](_base_src_result_.rooterror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975

___

### `Static` Error

▪ **Error**: *ErrorConstructor*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:984
