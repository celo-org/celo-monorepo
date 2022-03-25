[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [CircuitBreakerServiceError](_odis_circuit_breaker_.circuitbreakerserviceerror.md)

# Class: CircuitBreakerServiceError

## Hierarchy

* RootError‹[SERVICE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#service_error)›

  ↳ **CircuitBreakerServiceError**

## Implements

* BaseError‹[SERVICE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#service_error)›

## Index

### Constructors

* [constructor](_odis_circuit_breaker_.circuitbreakerserviceerror.md#constructor)

### Properties

* [error](_odis_circuit_breaker_.circuitbreakerserviceerror.md#optional-readonly-error)
* [errorType](_odis_circuit_breaker_.circuitbreakerserviceerror.md#readonly-errortype)
* [message](_odis_circuit_breaker_.circuitbreakerserviceerror.md#message)
* [name](_odis_circuit_breaker_.circuitbreakerserviceerror.md#name)
* [stack](_odis_circuit_breaker_.circuitbreakerserviceerror.md#optional-stack)
* [status](_odis_circuit_breaker_.circuitbreakerserviceerror.md#readonly-status)

## Constructors

###  constructor

\+ **new CircuitBreakerServiceError**(`status`: number, `error?`: Error): *[CircuitBreakerServiceError](_odis_circuit_breaker_.circuitbreakerserviceerror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L83)*

**Parameters:**

Name | Type |
------ | ------ |
`status` | number |
`error?` | Error |

**Returns:** *[CircuitBreakerServiceError](_odis_circuit_breaker_.circuitbreakerserviceerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L84)*

___

### `Readonly` errorType

• **errorType**: *[SERVICE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#service_error)*

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

___

### `Readonly` status

• **status**: *number*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L84)*
