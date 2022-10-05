[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [CircuitBreakerClient](_odis_circuit_breaker_.circuitbreakerclient.md)

# Class: CircuitBreakerClient

Client for interacting with a circuit breaker service for encrypted cloud backups.

**`remarks`** A circuit breaker is a service supporting a public decryption function backed by an HSM
key. If the need arises, the circuit breaker operator may take the decryption function offline.
A client can encrypt data to the circuit breaker public key and store it in a non-public place.
This data will then be available under normal circumstances, but become unavailable in the case
of an emergency.

It is intended for use in password-based key derivation when ODIS is used as a key hardening
function. Clients may include in their key dervivation a random value which they encrypt to the
circuit breaker public key. This allows the circuit breaker operator to disable key derivation,
by restricting access to the encrypted keying material, in the event that ODIS is conpromised.
This acts as a safety measure to allow wallet providers, or other users of ODIS key hardening, to
prevent attackers from being able to brute force their users' derived keys in the event that
ODIS is compromised such that it can no longer add to the key hardening.

The circuit breaker service is designed for use in the encrypted cloud backup protocol. More
information about encrypted cloud backup and the circuit breaker service can be found in the
official [Celo documentation](https://docs.celo.org/celo-codebase/protocol/identity/encrypted-cloud-backup)

## Hierarchy

* **CircuitBreakerClient**

## Index

### Constructors

* [constructor](_odis_circuit_breaker_.circuitbreakerclient.md#constructor)

### Properties

* [environment](_odis_circuit_breaker_.circuitbreakerclient.md#readonly-environment)

### Methods

* [status](_odis_circuit_breaker_.circuitbreakerclient.md#status)
* [unwrapKey](_odis_circuit_breaker_.circuitbreakerclient.md#unwrapkey)
* [wrapKey](_odis_circuit_breaker_.circuitbreakerclient.md#wrapkey)

## Constructors

###  constructor

\+ **new CircuitBreakerClient**(`environment`: [CircuitBreakerServiceContext](../interfaces/_odis_circuit_breaker_.circuitbreakerservicecontext.md)): *[CircuitBreakerClient](_odis_circuit_breaker_.circuitbreakerclient.md)*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`environment` | [CircuitBreakerServiceContext](../interfaces/_odis_circuit_breaker_.circuitbreakerservicecontext.md) |

**Returns:** *[CircuitBreakerClient](_odis_circuit_breaker_.circuitbreakerclient.md)*

## Properties

### `Readonly` environment

• **environment**: *[CircuitBreakerServiceContext](../interfaces/_odis_circuit_breaker_.circuitbreakerservicecontext.md)*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:136](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L136)*

## Methods

###  status

▸ **status**(): *Promise‹Result‹[CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md), [CircuitBreakerError](../modules/_odis_circuit_breaker_.md#circuitbreakererror)››*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:148](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L148)*

Check the current status of the circuit breaker service. Result will reflect whether or not
the circuit breaker keys are currently available.

**Returns:** *Promise‹Result‹[CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md), [CircuitBreakerError](../modules/_odis_circuit_breaker_.md#circuitbreakererror)››*

___

###  unwrapKey

▸ **unwrapKey**(`ciphertext`: Buffer): *Promise‹Result‹Buffer, [CircuitBreakerError](../modules/_odis_circuit_breaker_.md#circuitbreakererror)››*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L211)*

Request the circuit breaker service to decrypt the provided encrypted key value

**Parameters:**

Name | Type |
------ | ------ |
`ciphertext` | Buffer |

**Returns:** *Promise‹Result‹Buffer, [CircuitBreakerError](../modules/_odis_circuit_breaker_.md#circuitbreakererror)››*

___

###  wrapKey

▸ **wrapKey**(`plaintext`: Buffer): *Result‹Buffer, [EncryptionError](_odis_circuit_breaker_.encryptionerror.md)›*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:192](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L192)*

RSA-OAEP-256 Encrypt the provided key value against the public key of the circuit breaker.

**`remarks`** Note that this is an entirely local procedure and does not require interaction with
the circuit breaker service. Encryption occurs only against the service public key.

**Parameters:**

Name | Type |
------ | ------ |
`plaintext` | Buffer |

**Returns:** *Result‹Buffer, [EncryptionError](_odis_circuit_breaker_.encryptionerror.md)›*
