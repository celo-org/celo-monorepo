# Class: JSONParseError

## Hierarchy

  ↳ [RootError](_base_src_result_.rooterror.md)‹string›

  ↳ **JSONParseError**

## Implements

* [BaseError](../interfaces/_base_src_result_.baseerror.md)‹string›

## Index

### Constructors

* [constructor](_base_src_result_.jsonparseerror.md#constructor)

### Properties

* [error](_base_src_result_.jsonparseerror.md#error)
* [errorType](_base_src_result_.jsonparseerror.md#errortype)
* [message](_base_src_result_.jsonparseerror.md#message)
* [name](_base_src_result_.jsonparseerror.md#name)
* [stack](_base_src_result_.jsonparseerror.md#optional-stack)

## Constructors

###  constructor

\+ **new JSONParseError**(`error`: [Error](_base_src_result_.rooterror.md#static-error)): *[JSONParseError](_base_src_result_.jsonparseerror.md)*

*Overrides [RootError](_base_src_result_.rooterror.md).[constructor](_base_src_result_.rooterror.md#constructor)*

*Defined in [packages/base/src/result.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [Error](_base_src_result_.rooterror.md#static-error) |

**Returns:** *[JSONParseError](_base_src_result_.jsonparseerror.md)*

## Properties

###  error

• **error**: *[Error](_base_src_result_.rooterror.md#static-error)*

*Defined in [packages/base/src/result.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/result.ts#L80)*

___

###  errorType

• **errorType**: *string*

*Implementation of [BaseError](../interfaces/_base_src_result_.baseerror.md).[errorType](../interfaces/_base_src_result_.baseerror.md#errortype)*

*Inherited from [RootError](_base_src_result_.rooterror.md).[errorType](_base_src_result_.rooterror.md#errortype)*

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
