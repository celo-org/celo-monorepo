[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [InvalidBackupError](_errors_.invalidbackuperror.md)

# Class: InvalidBackupError

## Hierarchy

* RootError‹[INVALID_BACKUP_ERROR](../enums/_errors_.backuperrortypes.md#invalid_backup_error)›

  ↳ **InvalidBackupError**

## Implements

* BaseError‹[INVALID_BACKUP_ERROR](../enums/_errors_.backuperrortypes.md#invalid_backup_error)›

## Index

### Constructors

* [constructor](_errors_.invalidbackuperror.md#constructor)

### Properties

* [error](_errors_.invalidbackuperror.md#optional-readonly-error)
* [errorType](_errors_.invalidbackuperror.md#readonly-errortype)
* [message](_errors_.invalidbackuperror.md#message)
* [name](_errors_.invalidbackuperror.md#name)
* [stack](_errors_.invalidbackuperror.md#optional-stack)

## Constructors

###  constructor

\+ **new InvalidBackupError**(`error?`: Error): *[InvalidBackupError](_errors_.invalidbackuperror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[InvalidBackupError](_errors_.invalidbackuperror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L51)*

___

### `Readonly` errorType

• **errorType**: *[INVALID_BACKUP_ERROR](../enums/_errors_.backuperrortypes.md#invalid_backup_error)*

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
