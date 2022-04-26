[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [DecodeError](_errors_.decodeerror.md)

# Class: DecodeError

## Hierarchy

* RootError‹[DECODE_ERROR](../enums/_errors_.backuperrortypes.md#decode_error)›

  ↳ **DecodeError**

## Implements

* BaseError‹[DECODE_ERROR](../enums/_errors_.backuperrortypes.md#decode_error)›

## Index

### Constructors

* [constructor](_errors_.decodeerror.md#constructor)

### Properties

* [error](_errors_.decodeerror.md#optional-readonly-error)
* [errorType](_errors_.decodeerror.md#readonly-errortype)
* [message](_errors_.decodeerror.md#message)
* [name](_errors_.decodeerror.md#name)
* [stack](_errors_.decodeerror.md#optional-stack)

## Constructors

###  constructor

\+ **new DecodeError**(`error?`: Error): *[DecodeError](_errors_.decodeerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[DecodeError](_errors_.decodeerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L27)*

___

### `Readonly` errorType

• **errorType**: *[DECODE_ERROR](../enums/_errors_.backuperrortypes.md#decode_error)*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[errorType](_errors_.authorizationerror.md#readonly-errortype)*

Defined in packages/sdk/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[message](_errors_.authorizationerror.md#message)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[name](_errors_.authorizationerror.md#name)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[stack](_errors_.authorizationerror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975
