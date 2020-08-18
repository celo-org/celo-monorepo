# External module: "identity/odis/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)

### Functions

* [getPepperFromThresholdSignature](_identity_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_identity_odis_phone_number_identifier_.md#getphonenumberidentifier)

## Functions

###  getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*

___

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L30)*

Retrieve the on-chain identifier for the provided phone number

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`account` | string |
`signer` | [AuthSigner](_identity_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md) |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |
`blsBlindingClient?` | [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*
