[@celo/identity](../README.md) › ["offchain-data-wrapper"](../modules/_offchain_data_wrapper_.md) › [FetchError](_offchain_data_wrapper_.fetcherror.md)

# Class: FetchError

## Hierarchy

* RootError‹[FetchError](../enums/_offchain_data_wrapper_.offchainerrortypes.md#fetcherror)›

  ↳ **FetchError**

## Implements

* BaseError‹[FetchError](../enums/_offchain_data_wrapper_.offchainerrortypes.md#fetcherror)›

## Index

### Constructors

* [constructor](_offchain_data_wrapper_.fetcherror.md#constructor)

### Properties

* [errorType](_offchain_data_wrapper_.fetcherror.md#readonly-errortype)
* [message](_offchain_data_wrapper_.fetcherror.md#message)
* [name](_offchain_data_wrapper_.fetcherror.md#name)
* [stack](_offchain_data_wrapper_.fetcherror.md#optional-stack)

## Constructors

###  constructor

\+ **new FetchError**(`error`: Error): *[FetchError](_offchain_data_wrapper_.fetcherror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/offchain-data-wrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain-data-wrapper.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | Error |

**Returns:** *[FetchError](_offchain_data_wrapper_.fetcherror.md)*

## Properties

### `Readonly` errorType

• **errorType**: *[FetchError](../enums/_offchain_data_wrapper_.offchainerrortypes.md#fetcherror)*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[errorType](_offchain_accessors_errors_.invaliddataerror.md#readonly-errortype)*

Defined in packages/sdk/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[message](_offchain_accessors_errors_.invaliddataerror.md#message)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[name](_offchain_accessors_errors_.invaliddataerror.md#name)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[stack](_offchain_accessors_errors_.invaliddataerror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975
