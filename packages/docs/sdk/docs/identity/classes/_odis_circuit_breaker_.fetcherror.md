[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [FetchError](_odis_circuit_breaker_.fetcherror.md)

# Class: FetchError

## Hierarchy

* RootError‹[FETCH_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#fetch_error)›

  ↳ **FetchError**

## Implements

* BaseError‹[FETCH_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#fetch_error)›

## Index

### Constructors

* [constructor](_odis_circuit_breaker_.fetcherror.md#constructor)

### Properties

* [error](_odis_circuit_breaker_.fetcherror.md#optional-readonly-error)
* [errorType](_odis_circuit_breaker_.fetcherror.md#readonly-errortype)
* [message](_odis_circuit_breaker_.fetcherror.md#message)
* [name](_odis_circuit_breaker_.fetcherror.md#name)
* [stack](_odis_circuit_breaker_.fetcherror.md#optional-stack)

## Constructors

###  constructor

\+ **new FetchError**(`error?`: Error): *[FetchError](_odis_circuit_breaker_.fetcherror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[FetchError](_odis_circuit_breaker_.fetcherror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L102)*

___

### `Readonly` errorType

• **errorType**: *[FETCH_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#fetch_error)*

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
