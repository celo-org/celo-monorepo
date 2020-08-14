# External module: "identity/odis/query"

## Index

### Enumerations

* [AuthenticationMethod](../enums/_identity_odis_query_.authenticationmethod.md)
* [ErrorMessages](../enums/_identity_odis_query_.errormessages.md)

### Interfaces

* [EncryptionKeySigner](../interfaces/_identity_odis_query_.encryptionkeysigner.md)
* [MatchmakingRequest](../interfaces/_identity_odis_query_.matchmakingrequest.md)
* [MatchmakingResponse](../interfaces/_identity_odis_query_.matchmakingresponse.md)
* [PhoneNumberPrivacyRequest](../interfaces/_identity_odis_query_.phonenumberprivacyrequest.md)
* [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md)
* [SignMessageRequest](../interfaces/_identity_odis_query_.signmessagerequest.md)
* [SignMessageResponse](../interfaces/_identity_odis_query_.signmessageresponse.md)
* [WalletKeySigner](../interfaces/_identity_odis_query_.walletkeysigner.md)

### Type aliases

* [AuthSigner](_identity_odis_query_.md#authsigner)

### Functions

* [queryOdis](_identity_odis_query_.md#queryodis)

## Type aliases

###  AuthSigner

Ƭ **AuthSigner**: *[WalletKeySigner](../interfaces/_identity_odis_query_.walletkeysigner.md) | [EncryptionKeySigner](../interfaces/_identity_odis_query_.encryptionkeysigner.md)*

*Defined in [contractkit/src/identity/odis/query.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/query.ts#L23)*

## Functions

###  queryOdis

▸ **queryOdis**<**ResponseType**>(`signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `body`: [PhoneNumberPrivacyRequest](../interfaces/_identity_odis_query_.phonenumberprivacyrequest.md), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `endpoint`: string): *Promise‹ResponseType›*

*Defined in [contractkit/src/identity/odis/query.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/query.ts#L78)*

Make a request to lookup the phone number identifier or perform matchmaking

**Type parameters:**

▪ **ResponseType**

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [AuthSigner](_identity_odis_query_.md#authsigner) | type of key to sign with |
`body` | [PhoneNumberPrivacyRequest](../interfaces/_identity_odis_query_.phonenumberprivacyrequest.md) | request body |
`context` | [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md) | contains service URL |
`endpoint` | string | endpoint to hit  |

**Returns:** *Promise‹ResponseType›*
