[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [CircuitBreakerUnavailableError](_odis_circuit_breaker_.circuitbreakerunavailableerror.md)

# Class: CircuitBreakerUnavailableError

## Hierarchy

* RootError‹[UNAVAILABLE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#unavailable_error)›

  ↳ **CircuitBreakerUnavailableError**

## Implements

* BaseError‹[UNAVAILABLE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#unavailable_error)›

## Index

### Constructors

* [constructor](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#constructor)

### Properties

* [errorType](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#readonly-errortype)
* [message](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#message)
* [name](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#name)
* [stack](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#optional-stack)
* [status](_odis_circuit_breaker_.circuitbreakerunavailableerror.md#readonly-status)

## Constructors

###  constructor

\+ **new CircuitBreakerUnavailableError**(`status`: [CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md)): *[CircuitBreakerUnavailableError](_odis_circuit_breaker_.circuitbreakerunavailableerror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:89](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`status` | [CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md) |

**Returns:** *[CircuitBreakerUnavailableError](_odis_circuit_breaker_.circuitbreakerunavailableerror.md)*

## Properties

### `Readonly` errorType

• **errorType**: *[UNAVAILABLE_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#unavailable_error)*

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

• **status**: *[CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md)*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L90)*
