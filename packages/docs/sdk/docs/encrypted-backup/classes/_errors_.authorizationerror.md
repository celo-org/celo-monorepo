[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [AuthorizationError](_errors_.authorizationerror.md)

# Class: AuthorizationError

## Hierarchy

* RootError‹[AUTHORIZATION_ERROR](../enums/_errors_.backuperrortypes.md#authorization_error)›

  ↳ **AuthorizationError**

## Implements

* BaseError‹[AUTHORIZATION_ERROR](../enums/_errors_.backuperrortypes.md#authorization_error)›

## Index

### Constructors

* [constructor](_errors_.authorizationerror.md#constructor)

### Properties

* [error](_errors_.authorizationerror.md#optional-readonly-error)
* [errorType](_errors_.authorizationerror.md#readonly-errortype)
* [message](_errors_.authorizationerror.md#message)
* [name](_errors_.authorizationerror.md#name)
* [stack](_errors_.authorizationerror.md#optional-stack)

## Constructors

###  constructor

\+ **new AuthorizationError**(`error?`: Error): *[AuthorizationError](_errors_.authorizationerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[AuthorizationError](_errors_.authorizationerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L21)*

___

### `Readonly` errorType

• **errorType**: *[AUTHORIZATION_ERROR](../enums/_errors_.backuperrortypes.md#authorization_error)*

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
