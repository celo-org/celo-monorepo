# External module: "contractkit/src/utils/phone-number-lookup/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_identifier_.phonenumberhashdetails.md)

### Functions

* [getPhoneNumberIdentifier](_contractkit_src_utils_phone_number_lookup_phone_number_identifier_.md#getphonenumberidentifier)
* [getSaltFromThresholdSignature](_contractkit_src_utils_phone_number_lookup_phone_number_identifier_.md#getsaltfromthresholdsignature)

## Functions

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner), `context`: [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md), `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [contractkit/src/utils/phone-number-lookup/phone-number-identifier.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/phone-number-identifier.ts#L30)*

Retrieve the on-chain identifier for the provided phone number

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`account` | string |
`signer` | [AuthSigner](_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_lookup_.servicecontext.md) |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |
`blsBlindingClient?` | [BlsBlindingClient](../interfaces/_contractkit_src_utils_phone_number_lookup_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_phone_number_lookup_phone_number_identifier_.phonenumberhashdetails.md)›*

___

###  getSaltFromThresholdSignature

▸ **getSaltFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [contractkit/src/utils/phone-number-lookup/phone-number-identifier.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/phone-number-lookup/phone-number-identifier.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*
