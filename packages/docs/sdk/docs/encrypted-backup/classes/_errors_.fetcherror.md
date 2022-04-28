[@celo/encrypted-backup](../README.md) › ["errors"](../modules/_errors_.md) › [FetchError](_errors_.fetcherror.md)

# Class: FetchError

## Hierarchy

* RootError‹[FETCH_ERROR](../enums/_errors_.backuperrortypes.md#fetch_error)›

  ↳ **FetchError**

## Implements

* BaseError‹[FETCH_ERROR](../enums/_errors_.backuperrortypes.md#fetch_error)›

## Index

### Constructors

* [constructor](_errors_.fetcherror.md#constructor)

### Properties

* [error](_errors_.fetcherror.md#optional-readonly-error)
* [errorType](_errors_.fetcherror.md#readonly-errortype)
* [message](_errors_.fetcherror.md#message)
* [name](_errors_.fetcherror.md#name)
* [stack](_errors_.fetcherror.md#optional-stack)

## Constructors

###  constructor

\+ **new FetchError**(`error?`: Error): *[FetchError](_errors_.fetcherror.md)*

*Overrides void*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[FetchError](_errors_.fetcherror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/encrypted-backup/src/errors.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/errors.ts#L45)*

___

### `Readonly` errorType

• **errorType**: *[FETCH_ERROR](../enums/_errors_.backuperrortypes.md#fetch_error)*

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
