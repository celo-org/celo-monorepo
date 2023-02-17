[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [OdisRateLimitingError](_errors_.odisratelimitingerror.md)

# Class: OdisRateLimitingError

## Hierarchy

* RootError‹[ODIS_RATE_LIMITING_ERROR](../enums/_errors_.backuperrortypes.md#odis_rate_limiting_error)›

  ↳ **OdisRateLimitingError**

## Implements

* BaseError‹[ODIS_RATE_LIMITING_ERROR](../enums/_errors_.backuperrortypes.md#odis_rate_limiting_error)›

## Index

### Constructors

* [constructor](_errors_.odisratelimitingerror.md#constructor)

### Properties

* [error](_errors_.odisratelimitingerror.md#optional-readonly-error)
* [errorType](_errors_.odisratelimitingerror.md#readonly-errortype)
* [message](_errors_.odisratelimitingerror.md#message)
* [name](_errors_.odisratelimitingerror.md#name)
* [notBefore](_errors_.odisratelimitingerror.md#optional-readonly-notbefore)
* [stack](_errors_.odisratelimitingerror.md#optional-stack)

## Constructors

###  constructor

\+ **new OdisRateLimitingError**(`notBefore?`: undefined | number, `error?`: Error): *[OdisRateLimitingError](_errors_.odisratelimitingerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`notBefore?` | undefined &#124; number |
`error?` | Error |

**Returns:** *[OdisRateLimitingError](_errors_.odisratelimitingerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L63)*

___

### `Readonly` errorType

• **errorType**: *[ODIS_RATE_LIMITING_ERROR](../enums/_errors_.backuperrortypes.md#odis_rate_limiting_error)*

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

### `Optional` `Readonly` notBefore

• **notBefore**? : *undefined | number*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L63)*

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [AuthorizationError](_errors_.authorizationerror.md).[stack](_errors_.authorizationerror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975
