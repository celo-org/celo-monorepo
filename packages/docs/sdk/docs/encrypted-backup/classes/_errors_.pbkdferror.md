[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [PbkdfError](_errors_.pbkdferror.md)

# Class: PbkdfError

## Hierarchy

* RootError‹[PBKDF_ERROR](../enums/_errors_.backuperrortypes.md#pbkdf_error)›

  ↳ **PbkdfError**

## Implements

* BaseError‹[PBKDF_ERROR](../enums/_errors_.backuperrortypes.md#pbkdf_error)›

## Index

### Constructors

* [constructor](_errors_.pbkdferror.md#constructor)

### Properties

* [error](_errors_.pbkdferror.md#optional-readonly-error)
* [errorType](_errors_.pbkdferror.md#readonly-errortype)
* [iterations](_errors_.pbkdferror.md#readonly-iterations)
* [message](_errors_.pbkdferror.md#message)
* [name](_errors_.pbkdferror.md#name)
* [stack](_errors_.pbkdferror.md#optional-stack)

## Constructors

###  constructor

\+ **new PbkdfError**(`iterations`: number, `error?`: Error): *[PbkdfError](_errors_.pbkdferror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`iterations` | number |
`error?` | Error |

**Returns:** *[PbkdfError](_errors_.pbkdferror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L75)*

___

### `Readonly` errorType

• **errorType**: *[PBKDF_ERROR](../enums/_errors_.backuperrortypes.md#pbkdf_error)*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[errorType](_errors_.authorizationerror.md#readonly-errortype)*

Defined in packages/sdk/base/lib/result.d.ts:19

___

### `Readonly` iterations

• **iterations**: *number*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L75)*

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
