[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [EncryptionError](_errors_.encryptionerror.md)

# Class: EncryptionError

## Hierarchy

* RootError‹[ENCRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#encryption_error)›

  ↳ **EncryptionError**

## Implements

* BaseError‹[ENCRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#encryption_error)›

## Index

### Constructors

* [constructor](_errors_.encryptionerror.md#constructor)

### Properties

* [error](_errors_.encryptionerror.md#optional-readonly-error)
* [errorType](_errors_.encryptionerror.md#readonly-errortype)
* [message](_errors_.encryptionerror.md#message)
* [name](_errors_.encryptionerror.md#name)
* [stack](_errors_.encryptionerror.md#optional-stack)

## Constructors

###  constructor

\+ **new EncryptionError**(`error?`: Error): *[EncryptionError](_errors_.encryptionerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L38)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[EncryptionError](_errors_.encryptionerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L39)*

___

### `Readonly` errorType

• **errorType**: *[ENCRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#encryption_error)*

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
