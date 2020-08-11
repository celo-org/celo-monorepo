# External module: "contractkit/src/utils/odis/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_odis_phone_number_identifier_.phonenumberhashdetails.md)

### Functions

* [getPepperFromThresholdSignature](_contractkit_src_utils_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_contractkit_src_utils_odis_phone_number_identifier_.md#getphonenumberidentifier)

## Functions

###  getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [contractkit/src/utils/odis/phone-number-identifier.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/odis/phone-number-identifier.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*

___

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_contractkit_src_utils_odis_phone_number_lookup_.md#authsigner), `context`: [ServiceContext](../interfaces/_contractkit_src_utils_odis_phone_number_lookup_.servicecontext.md), `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_contractkit_src_utils_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [contractkit/src/utils/odis/phone-number-identifier.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/odis/phone-number-identifier.ts#L27)*

Retrieve the on-chain identifier for the provided phone number

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`account` | string |
`signer` | [AuthSigner](_contractkit_src_utils_odis_phone_number_lookup_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_contractkit_src_utils_odis_phone_number_lookup_.servicecontext.md) |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |
`blsBlindingClient?` | [BlsBlindingClient](../interfaces/_contractkit_src_utils_odis_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_contractkit_src_utils_odis_phone_number_identifier_.phonenumberhashdetails.md)›*
