[@celo/identity](../README.md) › ["odis/circuit-breaker.mock"](../modules/_odis_circuit_breaker_mock_.md) › [MockCircuitBreaker](_odis_circuit_breaker_mock_.mockcircuitbreaker.md)

# Class: MockCircuitBreaker

Mock circuit breaker implementation based on Valora implementaion
github.com/valora-inc/wallet/tree/main/packages/cloud-functions/src/circuitBreaker/circuitBreaker.ts

## Hierarchy

* **MockCircuitBreaker**

## Index

### Properties

* [keyStatus](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#keystatus)
* [environment](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#static-readonly-environment)
* [privateKey](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#static-readonly-privatekey)
* [publicKey](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#static-readonly-publickey)

### Methods

* [install](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#install)
* [installStatusEndpoint](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#installstatusendpoint)
* [installUnwrapKeyEndpoint](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#installunwrapkeyendpoint)
* [status](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#status)
* [unwrapKey](_odis_circuit_breaker_mock_.mockcircuitbreaker.md#unwrapkey)

## Properties

###  keyStatus

• **keyStatus**: *[CircuitBreakerKeyStatus](../enums/_odis_circuit_breaker_.circuitbreakerkeystatus.md)* = CircuitBreakerKeyStatus.ENABLED

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L53)*

___

### `Static` `Readonly` environment

▪ **environment**: *[CircuitBreakerServiceContext](../interfaces/_odis_circuit_breaker_.circuitbreakerservicecontext.md)* = MOCK_CIRCUIT_BREAKER_ENVIRONMENT

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L51)*

___

### `Static` `Readonly` privateKey

▪ **privateKey**: *"-----BEGIN PRIVATE KEY-----
MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAMa3FQ+WO36gcUF/
dGsNkc31NtOIjSQrhu/TZnZY/uRT89AKKRao2X39WMZVe4YyV/ClxZmuNbAlr6QG
VRhFcf+KddZQo7k+pOdpRdLUAtqwYBS/NHPdW/MLGmMqyNVLz+ACgltjYibCivjf
Y4us6yw2gruNuXVOBpXjvIYIrAX3AgMBAAECgYBGPqv8QZAweAjxLVv7B+X112wV
JN033wcpOiKrTVR1ZFP4w864iuGvTuKV4dvzmVJK6F7Mr6+c4AWRxwdHuCzOlwxj
O9RySFAXhoENu70zg8W2w4i8GMHsmdnNk045cF01Mb3GtQ6Y3uGb637XYTIwMEbC
Q74TbkrfPZPcSIpPEQJBAP4VModTr47oNvdyJITQ3fzIarRSDU0deZTpn6MXB3a1
abOAzlqYK3CSvLyyM9GOB9C5wvIZev+aNU9SkqPzU38CQQDINu7nOqS2X8UXQ5sS
wFrnoBQcU78i7Jaopvw0kOvkvklHlKVvXVkWP8PaWYdUAO9fpEdKdRnfaOEnqBwT
aymJAkEAgTXmbEtyjAoracryJ1jQiyyglvLjMMQ8gC4OsLGVahj3mAF47zlTXfxB
XvSAxaCk+NB/Av9SPYn+ckhbqmSjoQJAYb6H1bVIkoyg0OG9hGMKPkhlaQrtpmQw
jTewqw0RTQQlDGAigALnqjgJKsFIkxc9xciS0WPn9KzkNxMYWdaYWQJBAI8asXXb
XF5Lg2AAM2xJ/SS+h+si4f70eZey4vo9pWB3Q+VKbtRZu2pCjlR1A1nIqigJxdlc
1jHX+4GiW+t0w8Q=
-----END PRIVATE KEY-----"* = MOCK_CIRCUIT_BREAKER_PRIVATE_KEY

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L50)*

___

### `Static` `Readonly` publicKey

▪ **publicKey**: *"-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGtxUPljt+oHFBf3RrDZHN9TbT
iI0kK4bv02Z2WP7kU/PQCikWqNl9/VjGVXuGMlfwpcWZrjWwJa+kBlUYRXH/inXW
UKO5PqTnaUXS1ALasGAUvzRz3VvzCxpjKsjVS8/gAoJbY2Imwor432OLrOssNoK7
jbl1TgaV47yGCKwF9wIDAQAB
-----END PUBLIC KEY-----"* = MOCK_CIRCUIT_BREAKER_PUBLIC_KEY

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L49)*

## Methods

###  install

▸ **install**(`mock`: typeof fetchMock): *void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:133](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |

**Returns:** *void*

___

###  installStatusEndpoint

▸ **installStatusEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  installUnwrapKeyEndpoint

▸ **installUnwrapKeyEndpoint**(`mock`: typeof fetchMock, `override?`: any): *void*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L119)*

**Parameters:**

Name | Type |
------ | ------ |
`mock` | typeof fetchMock |
`override?` | any |

**Returns:** *void*

___

###  status

▸ **status**(): *object*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L55)*

**Returns:** *object*

* **body**: *[CircuitBreakerStatusResponse](../interfaces/_odis_circuit_breaker_.circuitbreakerstatusresponse.md)*

* **status**: *number*

___

###  unwrapKey

▸ **unwrapKey**(`req`: [CircuitBreakerUnwrapKeyRequest](../interfaces/_odis_circuit_breaker_.circuitbreakerunwrapkeyrequest.md)): *object*

*Defined in [packages/sdk/identity/src/odis/circuit-breaker.mock.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/circuit-breaker.mock.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`req` | [CircuitBreakerUnwrapKeyRequest](../interfaces/_odis_circuit_breaker_.circuitbreakerunwrapkeyrequest.md) |

**Returns:** *object*

* **body**: *[CircuitBreakerUnwrapKeyResponse](../interfaces/_odis_circuit_breaker_.circuitbreakerunwrapkeyresponse.md)*

* **status**: *number*
