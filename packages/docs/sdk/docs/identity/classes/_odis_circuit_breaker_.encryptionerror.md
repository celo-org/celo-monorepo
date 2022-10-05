[@celo/identity](../README.md) › ["odis/circuit-breaker"](../modules/_odis_circuit_breaker_.md) › [EncryptionError](_odis_circuit_breaker_.encryptionerror.md)

# Class: EncryptionError

## Hierarchy

* RootError‹[ENCRYPTION_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#encryption_error)›

  ↳ **EncryptionError**

## Implements

* BaseError‹[ENCRYPTION_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#encryption_error)›

## Index

### Constructors

* [constructor](_odis_circuit_breaker_.encryptionerror.md#constructor)

### Properties

* [error](_odis_circuit_breaker_.encryptionerror.md#optional-readonly-error)
* [errorType](_odis_circuit_breaker_.encryptionerror.md#readonly-errortype)
* [message](_odis_circuit_breaker_.encryptionerror.md#message)
* [name](_odis_circuit_breaker_.encryptionerror.md#name)
* [stack](_odis_circuit_breaker_.encryptionerror.md#optional-stack)

## Constructors

###  constructor

\+ **new EncryptionError**(`error?`: Error): *[EncryptionError](_odis_circuit_breaker_.encryptionerror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:95](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`error?` | Error |

**Returns:** *[EncryptionError](_odis_circuit_breaker_.encryptionerror.md)*

## Properties

### `Optional` `Readonly` error

• **error**? : *Error*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L96)*

___

### `Readonly` errorType

• **errorType**: *[ENCRYPTION_ERROR](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md#encryption_error)*

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
