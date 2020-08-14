# External module: "contractkit/src/utils/phone-number-lookup/phone-number-lookup"

## Index

### Enumerations

* [AuthenticationMethod](../enums/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.authenticationmethod.md)
* [ErrorMessages](../enums/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.errormessages.md)

### Interfaces

* [EncryptionKeySigner](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.encryptionkeysigner.md)
* [MatchmakingRequest](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.matchmakingrequest.md)
* [MatchmakingResponse](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.matchmakingresponse.md)
* [PhoneNumberPrivacyRequest](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.phonenumberprivacyrequest.md)
* [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md)
* [SignMessageRequest](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.signmessagerequest.md)
* [SignMessageResponse](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.signmessageresponse.md)
* [WalletKeySigner](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.walletkeysigner.md)

### Type aliases

* [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner)

### Functions

* [postToPhoneNumPrivacyService](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#posttophonenumprivacyservice)

## Type aliases

###  AuthSigner

Ƭ **AuthSigner**: *[WalletKeySigner](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.walletkeysigner.md) | [EncryptionKeySigner](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.encryptionkeysigner.md)*

*Defined in [contractkit/src/utils/phone-number-lookup/phone-number-lookup.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/phone-number-lookup.ts#L23)*

## Functions

###  postToPhoneNumPrivacyService

▸ **postToPhoneNumPrivacyService**<**ResponseType**>(`signer`: [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner), `body`: [PhoneNumberPrivacyRequest](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.phonenumberprivacyrequest.md), `context`: [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md), `endpoint`: string): *Promise‹ResponseType›*

*Defined in [contractkit/src/utils/phone-number-lookup/phone-number-lookup.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/phone-number-lookup.ts#L78)*

Make a request to lookup the phone number identifier or perform matchmaking

**Type parameters:**

▪ **ResponseType**

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`signer` | [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner) | type of key to sign with |
`body` | [PhoneNumberPrivacyRequest](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.phonenumberprivacyrequest.md) | request body |
`context` | [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md) | contains service URL |
`endpoint` | string | endpoint to hit  |

**Returns:** *Promise‹ResponseType›*
