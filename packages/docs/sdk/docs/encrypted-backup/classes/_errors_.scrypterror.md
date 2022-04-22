[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [ScryptError](_errors_.scrypterror.md)

# Class: ScryptError

## Hierarchy

* RootError‹[SCRYPT_ERROR](../enums/_errors_.backuperrortypes.md#scrypt_error)›

  ↳ **ScryptError**

## Implements

* BaseError‹[SCRYPT_ERROR](../enums/_errors_.backuperrortypes.md#scrypt_error)›

## Index

### Constructors

* [constructor](_errors_.scrypterror.md#constructor)

### Properties

* [error](_errors_.scrypterror.md#optional-readonly-error)
* [errorType](_errors_.scrypterror.md#readonly-errortype)
* [message](_errors_.scrypterror.md#message)
* [name](_errors_.scrypterror.md#name)
* [options](_errors_.scrypterror.md#readonly-options)
* [stack](_errors_.scrypterror.md#optional-stack)

## Constructors

###  constructor

\+ **new ScryptError**(`options`: [ScryptOptions](../interfaces/_utils_.scryptoptions.md), `error?`: Error): *[ScryptError](_errors_.scrypterror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [ScryptOptions](../interfaces/_utils_.scryptoptions.md) |
`error?` | Error |

**Returns:** *[ScryptError](_errors_.scrypterror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L81)*

___

### `Readonly` errorType

• **errorType**: *[SCRYPT_ERROR](../enums/_errors_.backuperrortypes.md#scrypt_error)*

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

### `Readonly` options

• **options**: *[ScryptOptions](../interfaces/_utils_.scryptoptions.md)*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L81)*

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[stack](_errors_.authorizationerror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975
