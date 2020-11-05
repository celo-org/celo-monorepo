# External module: "identity/odis/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)

### Variables

* [ODIS_MINIMUM_CELO_BALANCE](_identity_odis_phone_number_identifier_.md#const-odis_minimum_celo_balance)
* [ODIS_MINIMUM_DOLLAR_BALANCE](_identity_odis_phone_number_identifier_.md#const-odis_minimum_dollar_balance)

### Functions

* [getBlindedPhoneNumber](_identity_odis_phone_number_identifier_.md#getblindedphonenumber)
* [getBlindedPhoneNumberSignature](_identity_odis_phone_number_identifier_.md#getblindedphonenumbersignature)
* [getPepperFromThresholdSignature](_identity_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_identity_odis_phone_number_identifier_.md#getphonenumberidentifier)
* [getPhoneNumberIdentifierFromSignature](_identity_odis_phone_number_identifier_.md#getphonenumberidentifierfromsignature)
* [isBalanceSufficientForSigRetrieval](_identity_odis_phone_number_identifier_.md#isbalancesufficientforsigretrieval)

## Variables

### `Const` ODIS_MINIMUM_CELO_BALANCE

• **ODIS_MINIMUM_CELO_BALANCE**: *0.005* = 0.005

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L18)*

___

### `Const` ODIS_MINIMUM_DOLLAR_BALANCE

• **ODIS_MINIMUM_DOLLAR_BALANCE**: *0.01* = 0.01

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L16)*

## Functions

###  getBlindedPhoneNumber

▸ **getBlindedPhoneNumber**(`e164Number`: string, `blsBlindingClient`: [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L74)*

Blinds the phone number in preparation for the ODIS request
Caller should use the same blsBlindingClient instance for unblinding

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`blsBlindingClient` | [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹string›*

___

###  getBlindedPhoneNumberSignature

▸ **getBlindedPhoneNumberSignature**(`account`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `base64BlindedMessage`: string, `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string): *Promise‹string›*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L88)*

Query ODIS for the blinded signature
Response can be passed into getPhoneNumberIdentifierFromSignature
to retrieve the on-chain identifier

**Parameters:**

Name | Type |
------ | ------ |
`account` | string |
`signer` | [AuthSigner](_identity_odis_query_.md#authsigner) |
`context` | [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md) |
`base64BlindedMessage` | string |
`selfPhoneHash?` | undefined &#124; string |
`clientVersion?` | undefined &#124; string |

**Returns:** *Promise‹string›*

___

###  getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:134](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L134)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*

___

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L36)*

Retrieve the on-chain identifier for the provided phone number
Performs blinding, querying, and unblinding

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

___

###  getPhoneNumberIdentifierFromSignature

▸ **getPhoneNumberIdentifierFromSignature**(`e164Number`: string, `base64BlindedSignature`: string, `blsBlindingClient`: [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L117)*

Unblind the response and return the on-chain identifier

**Parameters:**

Name | Type |
------ | ------ |
`e164Number` | string |
`base64BlindedSignature` | string |
`blsBlindingClient` | [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md) |

**Returns:** *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

___

###  isBalanceSufficientForSigRetrieval

▸ **isBalanceSufficientForSigRetrieval**(`dollarBalance`: BigNumber.Value, `celoBalance`: BigNumber.Value): *boolean*

*Defined in [packages/contractkit/src/identity/odis/phone-number-identifier.ts:145](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L145)*

Check if balance is sufficient for quota retrieval

**Parameters:**

Name | Type |
------ | ------ |
`dollarBalance` | BigNumber.Value |
`celoBalance` | BigNumber.Value |

**Returns:** *boolean*
