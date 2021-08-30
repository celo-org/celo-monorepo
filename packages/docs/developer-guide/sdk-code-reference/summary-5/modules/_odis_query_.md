# odis/query

## Index

### Enumerations

* [AuthenticationMethod]()
* [ErrorMessages]()

### Interfaces

* [CustomSigner]()
* [EncryptionKeySigner]()
* [MatchmakingRequest]()
* [MatchmakingResponse]()
* [PhoneNumberPrivacyRequest]()
* [ServiceContext]()
* [SignMessageRequest]()
* [SignMessageResponse]()
* [WalletKeySigner]()

### Type aliases

* [AuthSigner](_odis_query_.md#authsigner)

### Functions

* [getServiceContext](_odis_query_.md#getservicecontext)
* [queryOdis](_odis_query_.md#queryodis)
* [signWithDEK](_odis_query_.md#signwithdek)

### Object literals

* [ODIS\_ALFAJORESSTAGING\_CONTEXT](_odis_query_.md#const-odis_alfajoresstaging_context)
* [ODIS\_ALFAJORES\_CONTEXT](_odis_query_.md#const-odis_alfajores_context)
* [ODIS\_MAINNET\_CONTEXT](_odis_query_.md#const-odis_mainnet_context)

## Type aliases

### AuthSigner

Ƭ **AuthSigner**: [_WalletKeySigner_]() _\|_ [_EncryptionKeySigner_]() _\|_ [_CustomSigner_]()

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L29)

## Functions

### getServiceContext

▸ **getServiceContext**\(`contextName`: string\): [_ServiceContext_]()

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:98_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L98)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `contextName` | string | "mainnet" |

**Returns:** [_ServiceContext_]()

### queryOdis

▸ **queryOdis**&lt;**ResponseType**&gt;\(`signer`: [AuthSigner](_odis_query_.md#authsigner), `body`: [PhoneNumberPrivacyRequest](), `context`: [ServiceContext](), `endpoint`: string\): _Promise‹ResponseType›_

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:128_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L128)

Make a request to lookup the phone number identifier or perform matchmaking

**Type parameters:**

▪ **ResponseType**

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `signer` | [AuthSigner](_odis_query_.md#authsigner) | type of key to sign with |
| `body` | [PhoneNumberPrivacyRequest]() | request body |
| `context` | [ServiceContext]() | contains service URL |
| `endpoint` | string | endpoint to hit |

**Returns:** _Promise‹ResponseType›_

### signWithDEK

▸ **signWithDEK**\(`message`: string, `signer`: [EncryptionKeySigner]()\): _string_

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:109_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L109)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |
| `signer` | [EncryptionKeySigner]() |

**Returns:** _string_

## Object literals

### `Const` ODIS\_ALFAJORESSTAGING\_CONTEXT

### ▪ **ODIS\_ALFAJORESSTAGING\_CONTEXT**: _object_

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L86)

### odisPubKey

• **odisPubKey**: _string_ = "7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L88)

### odisUrl

• **odisUrl**: _string_ = "[https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net](https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net)"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L87)

### `Const` ODIS\_ALFAJORES\_CONTEXT

### ▪ **ODIS\_ALFAJORES\_CONTEXT**: _object_

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L80)

### odisPubKey

• **odisPubKey**: _string_ = "kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L82)

### odisUrl

• **odisUrl**: _string_ = "[https://us-central1-celo-phone-number-privacy.cloudfunctions.net](https://us-central1-celo-phone-number-privacy.cloudfunctions.net)"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L81)

### `Const` ODIS\_MAINNET\_CONTEXT

### ▪ **ODIS\_MAINNET\_CONTEXT**: _object_

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:92_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L92)

### odisPubKey

• **odisPubKey**: _string_ = "FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L94)

### odisUrl

• **odisUrl**: _string_ = "[https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net](https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net)"

_Defined in_ [_packages/sdk/identity/src/odis/query.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L93)

