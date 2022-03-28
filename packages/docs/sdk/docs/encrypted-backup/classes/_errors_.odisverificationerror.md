[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [OdisVerificationError](_errors_.odisverificationerror.md)

# Class: OdisVerificationError

## Hierarchy

* RootError‹[ODIS_VERIFICATION_ERROR](../enums/_errors_.backuperrortypes.md#odis_verification_error)›

  ↳ **OdisVerificationError**

## Implements

* BaseError‹[ODIS_VERIFICATION_ERROR](../enums/_errors_.backuperrortypes.md#odis_verification_error)›

## Index

### Constructors

* [constructor](_errors_.odisverificationerror.md#constructor)

### Properties

* [error](_errors_.odisverificationerror.md#optional-readonly-error)
* [errorType](_errors_.odisverificationerror.md#readonly-errortype)
* [message](_errors_.odisverificationerror.md#message)
* [name](_errors_.odisverificationerror.md#name)
* [stack](_errors_.odisverificationerror.md#optional-stack)

## Constructors

###  constructor

\+ **new OdisVerificationError**(`error?`: Error): *[OdisVerificationError](_errors_.odisverificationerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[OdisVerificationError](_errors_.odisverificationerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L69)*

___

### `Readonly` errorType

• **errorType**: *[ODIS_VERIFICATION_ERROR](../enums/_errors_.backuperrortypes.md#odis_verification_error)*

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
