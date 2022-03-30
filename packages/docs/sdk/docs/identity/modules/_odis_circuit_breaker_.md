[@celo/identity](../README.md) › ["odis/circuit-breaker"](_odis_circuit_breaker_.md)

# Module: "odis/circuit-breaker"

## Index

### Enumerations

* [CircuitBreakerEndpoints](../enums/_odis_circuit_breaker_.circuitbreakerendpoints.md)
* [CircuitBreakerErrorTypes](../enums/_odis_circuit_breaker_.circuitbreakererrortypes.md)
* [CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md)

### Classes

* [CircuitBreakerClient](../classes/_odis_circuit_breaker_.circuitbreakerclient.md)
* [CircuitBreakerServiceError](../classes/_odis_circuit_breaker_.circuitbreakerserviceerror.md)
* [CircuitBreakerUnavailableError](../classes/_odis_circuit_breaker_.circuitbreakerunavailableerror.md)
* [EncryptionError](../classes/_odis_circuit_breaker_.encryptionerror.md)
* [FetchError](../classes/_odis_circuit_breaker_.fetcherror.md)

### Interfaces

* [CircuitBreakerServiceContext](../interfaces/_odis_circuit_breaker_.circuitbreakerservicecontext.md)
* [CircuitBreakerStatusResponse](../interfaces/_odis_circuit_breaker_.circuitbreakerstatusresponse.md)
* [CircuitBreakerUnwrapKeyRequest](../interfaces/_odis_circuit_breaker_.circuitbreakerunwrapkeyrequest.md)
* [CircuitBreakerUnwrapKeyResponse](../interfaces/_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md)

### Type aliases

* [CircuitBreakerError](_odis_circuit_breaker_.md#circuitbreakererror)

### Variables

* [BASE64_REGEXP](_odis_circuit_breaker_.md#const-base64_regexp)

### Object literals

* [VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT](_odis_circuit_breaker_.md#const-valora_alfajores_circuit_breaker_environment)
* [VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT](_odis_circuit_breaker_.md#const-valora_mainnet_circuit_breaker_environment)

## Type aliases

###  CircuitBreakerError

Ƭ **CircuitBreakerError**: *[CircuitBreakerServiceError](../classes/_odis_circuit_breaker_.circuitbreakerserviceerror.md) | [CircuitBreakerUnavailableError](../classes/_odis_circuit_breaker_.circuitbreakerunavailableerror.md) | [EncryptionError](../classes/_odis_circuit_breaker_.encryptionerror.md) | [FetchError](../classes/_odis_circuit_breaker_.fetcherror.md)*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L107)*

## Variables

### `Const` BASE64_REGEXP

• **BASE64_REGEXP**: *RegExp‹›* = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:5](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L5)*

## Object literals

### `Const` VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT

### ▪ **VALORA_ALFAJORES_CIRCUIT_BREAKER_ENVIRONMENT**: *object*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L12)*

###  publicKey

• **publicKey**: *string* = `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAsYkNg3iY1ha4KGCGvHLl
mOMKV63lq+WsHIgUGfEuyfOWEBetVux9gvQEEPYpKbHgVQrfcegp28LoZYehWZHC
dIHSACcW0SGZagSOFEgxVSY6MgZZjmbTdlUtLac2cvxIDx8qhkoBjWRWu4g5LfdW
9QA0tiM3dR/pmA8YWcIYtyjGY1zglA/YqHClKsDRY+dbhshfILfohdFsVNJ3CWLS
J4yGvVe78AE/WiaXISV5ol+bqve4QlxzbBLIV4s44YONCh18/YhmGHCuSn8yy1/0
q3YW7COaFEGd7m8VnV2rU/dFLKyF0XEanS6xk9ciL9uafR9dMryEQ7AW+yKmfQBG
H2i5uiKnWW2a3a873ShG2Qphl9mw1Kcrdxug4qk9y7RoKlMnG3Wdr4HMQb9S8KYf
07ZyVEbFip26ANWGo8dCA8fWvVtU5DByoWPI+PuglOB22z2noXov98imSFJfz9vu
yGAQt3CUOwUQvt+RObDXiHHIxJjU+6/81X3Jdnt3dFEfAgMBAAE=
-----END PUBLIC KEY-----`

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L14)*

###  url

• **url**: *string* = "https://us-central1-celo-mobile-alfajores.cloudfunctions.net/circuitBreaker/"

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L13)*

___

### `Const` VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT

### ▪ **VALORA_MAINNET_CIRCUIT_BREAKER_ENVIRONMENT**: *object*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L27)*

###  publicKey

• **publicKey**: *string* = `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEArQ89m/HIGECXR7ceZZRS
b6MZEw1S1o5qgi6sLEejBMUQhM/wgySoo5ydiW7S4iyiqEksQNAlOs5Mrv1aE9Ul
bG+rpglOA1xYLyjY7xUZE2tyPksPXcSKgu6d+G9gVtbmFld1Kr0jVx4qOLejtH3S
dGbX6g9GshgB1W4iEDZ4qEJBuvItSTudK3BFM1mBfEq1w3kDxNzYKC1zFlw+DWWh
BgIPB7zEp+MJNTwel2z7H02wsEMJMXzKwaAWaDp8PYfF3RwgCDIFkf+QteYIEUrG
C9bFhdYpDGY9Ldiz7kca9G9dvXWpZUQOYyOY7CFx0k2XcTBwx4Lq524lNR8waIDu
OT5jj2SIwXf5eKtyFMUqRNnqgs+IHHcWgh0CH7mfhPlFBMivKlwHgQqCJH3rHlgu
CMi3ENv4+p7+svshngntxGkEzZcLV3YVW7BG6xSOAqC1tjkM1PkmXENQOq+bxAL6
bg3W6cTRQAQxoicu6+1c5Tdb/K36TXx0mHan7/Z8JCqfAgMBAAE=
-----END PUBLIC KEY-----`

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L29)*

###  url

• **url**: *string* = "https://us-central1-celo-mobile-mainnet.cloudfunctions.net/circuitBreaker/"

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.ts#L28)*
