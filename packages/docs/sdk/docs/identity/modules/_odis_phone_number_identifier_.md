[@celo/identity](../README.md) › ["odis/phone-number-identifier"](_odis_phone_number_identifier_.md)

# Module: "odis/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_odis_phone_number_identifier_.phonenumberhashdetails.md)

### Variables

* [ODIS_MINIMUM_CELO_BALANCE](_odis_phone_number_identifier_.md#const-odis_minimum_celo_balance)
* [ODIS_MINIMUM_DOLLAR_BALANCE](_odis_phone_number_identifier_.md#const-odis_minimum_dollar_balance)

### Functions

* [getBlindedPhoneNumber](_odis_phone_number_identifier_.md#getblindedphonenumber)
* [getBlindedPhoneNumberSignature](_odis_phone_number_identifier_.md#getblindedphonenumbersignature)
* [getPepperFromThresholdSignature](_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_odis_phone_number_identifier_.md#getphonenumberidentifier)
* [getPhoneNumberIdentifierFromSignature](_odis_phone_number_identifier_.md#getphonenumberidentifierfromsignature)
* [isBalanceSufficientForSigRetrieval](_odis_phone_number_identifier_.md#isbalancesufficientforsigretrieval)

## Variables

### `Const` ODIS_MINIMUM_CELO_BALANCE

• **ODIS_MINIMUM_CELO_BALANCE**: *0.005* = 0.005

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L19)*

___

### `Const` ODIS_MINIMUM_DOLLAR_BALANCE

• **ODIS_MINIMUM_DOLLAR_BALANCE**: *0.01* = 0.01

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L17)*

## Functions

###  getBlindedPhoneNumber

▸ **getBlindedPhoneNumber**(`e164Number`: string, `blsBlindingClient`: [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md), `seed?`: Buffer): *Promise‹string›*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L87)*

Blinds the phone number in preparation for the ODIS request
Caller should use the same blsBlindingClient instance for unblinding

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`blsBlindingClient` | [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md) |
`seed?` | Buffer |

**Returns:** *Promise‹string›*

___

###  getBlindedPhoneNumberSignature

▸ **getBlindedPhoneNumberSignature**(`account`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_odis_query_.servicecontext.md), `base64BlindedMessage`: string, `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `sessionID?`: undefined | string): *Promise‹string›*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L102)*

Query ODIS for the blinded signature
Response can be passed into getPhoneNumberIdentifierFromSignature
to retrieve the on-chain identifier

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |
`signer` | [AuthSigner](_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_odis_query_.servicecontext.md) |
`base64BlindedMessage` | string |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |
`sessionID?` | undefined &#124; string |

**Returns:** *Promise‹string›*

___

###  getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*

___

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_odis_query_.servicecontext.md), `blindingFactor?`: undefined | string, `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md), `sessionID?`: undefined | string): *Promise‹[PhoneNumberHashDetails](../interfaces/_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L37)*

Retrieve the on-chain identifier for the provided phone number
Performs blinding, querying, and unblinding

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`account` | string |
`signer` | [AuthSigner](_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_odis_query_.servicecontext.md) |
`blindingFactor?` | undefined &#124; string |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |
`blsBlindingClient?` | [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md) |
`sessionID?` | undefined &#124; string |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

___

###  getPhoneNumberIdentifierFromSignature

▸ **getPhoneNumberIdentifierFromSignature**(`e164Number`: string, `base64BlindedSignature`: string, `blsBlindingClient`: [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:135](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L135)*

Unblind the response and return the on-chain identifier

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`base64BlindedSignature` | string |
`blsBlindingClient` | [BlsBlindingClient](../interfaces/_odis_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

___

###  isBalanceSufficientForSigRetrieval

▸ **isBalanceSufficientForSigRetrieval**(`dollarBalance`: BigNumber.Value, `celoBalance`: BigNumber.Value): *boolean*

*Defined in [packages/sdk/identity/src/odis/phone-number-identifier.ts:160](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L160)*

Check if balance is sufficient for quota retrieval

**Parameters:**

Name | Type |
------ | ------ |
`dollarBalance` | BigNumber.Value |
`celoBalance` | BigNumber.Value |

**Returns:** *boolean*
