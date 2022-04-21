[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [DecryptionError](_errors_.decryptionerror.md)

# Class: DecryptionError

## Hierarchy

* RootError‹[DECRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#decryption_error)›

  ↳ **DecryptionError**

## Implements

* BaseError‹[DECRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#decryption_error)›

## Index

### Constructors

* [constructor](_errors_.decryptionerror.md#constructor)

### Properties

* [error](_errors_.decryptionerror.md#optional-readonly-error)
* [errorType](_errors_.decryptionerror.md#readonly-errortype)
* [message](_errors_.decryptionerror.md#message)
* [name](_errors_.decryptionerror.md#name)
* [stack](_errors_.decryptionerror.md#optional-stack)

## Constructors

###  constructor

\+ **new DecryptionError**(`error?`: Error): *[DecryptionError](_errors_.decryptionerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[DecryptionError](_errors_.decryptionerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L33)*

___

### `Readonly` errorType

• **errorType**: *[DECRYPTION_ERROR](../enums/_errors_.backuperrortypes.md#decryption_error)*

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
