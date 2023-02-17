[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [OdisServiceError](_errors_.odisserviceerror.md)

# Class: OdisServiceError

## Hierarchy

* RootError‹[ODIS_SERVICE_ERROR](../enums/_errors_.backuperrortypes.md#odis_service_error)›

  ↳ **OdisServiceError**

## Implements

* BaseError‹[ODIS_SERVICE_ERROR](../enums/_errors_.backuperrortypes.md#odis_service_error)›

## Index

### Constructors

* [constructor](_errors_.odisserviceerror.md#constructor)

### Properties

* [error](_errors_.odisserviceerror.md#optional-readonly-error)
* [errorType](_errors_.odisserviceerror.md#readonly-errortype)
* [message](_errors_.odisserviceerror.md#message)
* [name](_errors_.odisserviceerror.md#name)
* [stack](_errors_.odisserviceerror.md#optional-stack)
* [version](_errors_.odisserviceerror.md#optional-readonly-version)

## Constructors

###  constructor

\+ **new OdisServiceError**(`error?`: Error, `version?`: undefined | string): *[OdisServiceError](_errors_.odisserviceerror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |
`version?` | undefined &#124; string |

**Returns:** *[OdisServiceError](_errors_.odisserviceerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L57)*

___

### `Readonly` errorType

• **errorType**: *[ODIS_SERVICE_ERROR](../enums/_errors_.backuperrortypes.md#odis_service_error)*

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

___

### `Optional` `Readonly` version

• **version**? : *undefined | string*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L57)*
