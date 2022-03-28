[@celo/identity](../README.md) › ["odis/query"](_odis_query_.md)

# Module: "odis/query"

## Index

### Enumerations

* [ErrorMessages](../enums/_odis_query_.errormessages.md)

### Interfaces

* [CombinerSignMessageResponse](../interfaces/_odis_query_.combinersignmessageresponse.md)
* [EncryptionKeySigner](../interfaces/_odis_query_.encryptionkeysigner.md)
* [ServiceContext](../interfaces/_odis_query_.servicecontext.md)
* [WalletKeySigner](../interfaces/_odis_query_.walletkeysigner.md)

### Type aliases

* [AuthSigner](_odis_query_.md#authsigner)
* [MatchmakingRequest](_odis_query_.md#matchmakingrequest)
* [MatchmakingResponse](_odis_query_.md#matchmakingresponse)
* [SignMessageRequest](_odis_query_.md#signmessagerequest)
* [SignMessageResponse](_odis_query_.md#signmessageresponse)

### Functions

* [getServiceContext](_odis_query_.md#getservicecontext)
* [queryOdis](_odis_query_.md#queryodis)
* [sendOdisDomainRequest](_odis_query_.md#sendodisdomainrequest)
* [signWithDEK](_odis_query_.md#signwithdek)
* [signWithRawKey](_odis_query_.md#signwithrawkey)

### Object literals

* [ODIS_ALFAJORESSTAGING_CONTEXT](_odis_query_.md#const-odis_alfajoresstaging_context)
* [ODIS_ALFAJORES_CONTEXT](_odis_query_.md#const-odis_alfajores_context)
* [ODIS_MAINNET_CONTEXT](_odis_query_.md#const-odis_mainnet_context)

## Type aliases

###  AuthSigner

Ƭ **AuthSigner**: *[WalletKeySigner](../interfaces/_odis_query_.walletkeysigner.md) | [EncryptionKeySigner](../interfaces/_odis_query_.encryptionkeysigner.md)*

*Defined in [packages/sdk/identity/src/odis/query.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L36)*

___

###  MatchmakingRequest

Ƭ **MatchmakingRequest**: *GetContactMatchesRequest*

*Defined in [packages/sdk/identity/src/odis/query.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L41)*

___

###  MatchmakingResponse

Ƭ **MatchmakingResponse**: *GetContactMatchesResponse*

*Defined in [packages/sdk/identity/src/odis/query.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L42)*

___

###  SignMessageRequest

Ƭ **SignMessageRequest**: *GetBlindedMessageSigRequest*

*Defined in [packages/sdk/identity/src/odis/query.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L40)*

___

###  SignMessageResponse

Ƭ **SignMessageResponse**: *[CombinerSignMessageResponse](../interfaces/_odis_query_.combinersignmessageresponse.md)*

*Defined in [packages/sdk/identity/src/odis/query.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L51)*

**`deprecated`** Exported as SignMessageResponse for backwards compatibility.

## Functions

###  getServiceContext

▸ **getServiceContext**(`contextName`: string): *[ServiceContext](../interfaces/_odis_query_.servicecontext.md)*

*Defined in [packages/sdk/identity/src/odis/query.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L86)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`contextName` | string | "mainnet" |

**Returns:** *[ServiceContext](../interfaces/_odis_query_.servicecontext.md)*

___

###  queryOdis

▸ **queryOdis**<**ResponseType**>(`signer`: [AuthSigner](_odis_query_.md#authsigner), `body`: PhoneNumberPrivacyRequest, `context`: [ServiceContext](../interfaces/_odis_query_.servicecontext.md), `endpoint`: PhoneNumberPrivacyEndpoint | CombinerEndpoint): *Promise‹ResponseType›*

*Defined in [packages/sdk/identity/src/odis/query.ts:124](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L124)*

Make a request to lookup the phone number identifier or perform matchmaking

**Type parameters:**

▪ **ResponseType**

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [AuthSigner](_odis_query_.md#authsigner) | Type of key to sign with. May be undefined if the request is presigned. |
`body` | PhoneNumberPrivacyRequest | Request to send in the body of the HTTP request. |
`context` | [ServiceContext](../interfaces/_odis_query_.servicecontext.md) | Contains service URL and public to determine which instance to contact. |
`endpoint` | PhoneNumberPrivacyEndpoint &#124; CombinerEndpoint | Endpoint to query (e.g. '/getBlindedMessagePartialSig', '/getContactMatches').  |

**Returns:** *Promise‹ResponseType›*

___

###  sendOdisDomainRequest

▸ **sendOdisDomainRequest**<**RequestType**>(`body`: RequestType, `context`: [ServiceContext](../interfaces/_odis_query_.servicecontext.md), `endpoint`: DomainEndpoint, `responseSchema`: Type‹DomainResponse‹RequestType››): *Promise‹DomainResponse‹RequestType››*

*Defined in [packages/sdk/identity/src/odis/query.ts:209](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L209)*

Send the given domain request to ODIS (e.g. to get a POPRF evaluation or check quota).

**Type parameters:**

▪ **RequestType**: *DomainRequest‹Domain›*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`body` | RequestType | Request to send in the body of the HTTP request. |
`context` | [ServiceContext](../interfaces/_odis_query_.servicecontext.md) | Contains service URL and public to determine which instance to contact. |
`endpoint` | DomainEndpoint | Endpoint to query (e.g. '/domain/sign', '/domain/quotaStatus'). |
`responseSchema` | Type‹DomainResponse‹RequestType›› | io-ts type for the expected response type. Provided to ensure type safety.  |

**Returns:** *Promise‹DomainResponse‹RequestType››*

___

###  signWithDEK

▸ **signWithDEK**(`msg`: string, `signer`: [EncryptionKeySigner](../interfaces/_odis_query_.encryptionkeysigner.md)): *string*

*Defined in [packages/sdk/identity/src/odis/query.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`msg` | string |
`signer` | [EncryptionKeySigner](../interfaces/_odis_query_.encryptionkeysigner.md) |

**Returns:** *string*

___

###  signWithRawKey

▸ **signWithRawKey**(`msg`: string, `rawKey`: string): *string*

*Defined in [packages/sdk/identity/src/odis/query.ts:101](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L101)*

**Parameters:**

Name | Type |
------ | ------ |
`msg` | string |
`rawKey` | string |

**Returns:** *string*

## Object literals

### `Const` ODIS_ALFAJORESSTAGING_CONTEXT

### ▪ **ODIS_ALFAJORESSTAGING_CONTEXT**: *object*

*Defined in [packages/sdk/identity/src/odis/query.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L74)*

###  odisPubKey

• **odisPubKey**: *string* = "7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA"

*Defined in [packages/sdk/identity/src/odis/query.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L76)*

###  odisUrl

• **odisUrl**: *string* = "https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net"

*Defined in [packages/sdk/identity/src/odis/query.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L75)*

___

### `Const` ODIS_ALFAJORES_CONTEXT

### ▪ **ODIS_ALFAJORES_CONTEXT**: *object*

*Defined in [packages/sdk/identity/src/odis/query.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L68)*

###  odisPubKey

• **odisPubKey**: *string* = "kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA"

*Defined in [packages/sdk/identity/src/odis/query.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L70)*

###  odisUrl

• **odisUrl**: *string* = "https://us-central1-celo-phone-number-privacy.cloudfunctions.net"

*Defined in [packages/sdk/identity/src/odis/query.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L69)*

___

### `Const` ODIS_MAINNET_CONTEXT

### ▪ **ODIS_MAINNET_CONTEXT**: *object*

*Defined in [packages/sdk/identity/src/odis/query.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L80)*

###  odisPubKey

• **odisPubKey**: *string* = "FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA"

*Defined in [packages/sdk/identity/src/odis/query.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L82)*

###  odisUrl

• **odisUrl**: *string* = "https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net"

*Defined in [packages/sdk/identity/src/odis/query.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/query.ts#L81)*
