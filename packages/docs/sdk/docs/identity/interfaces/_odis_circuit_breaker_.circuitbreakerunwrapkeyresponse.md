[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [CircuitBreakerUnwrapKeyResponse](_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md)

# Interface: CircuitBreakerUnwrapKeyResponse

## Hierarchy

* **CircuitBreakerUnwrapKeyResponse**

## Index

### Properties

* [error](_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md#optional-error)
* [plaintext](_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md#optional-plaintext)
* [status](_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md#optional-status)

## Properties

### `Optional` error

• **error**? : *undefined | string*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L70)*

Error message indicating what went wrong if the ciphertext could not be decrypted

___

### `Optional` plaintext

• **plaintext**? : *undefined | string*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L67)*

Decryption of the ciphertext provided to the circuit breaker service

___

### `Optional` status

• **status**? : *[CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md)*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L73)*

Status of the circuit breaker service. Included if the service is not enabled.
