# External module: "identity/odis/phone-number-identifier"

## Index

### Interfaces

* [PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)

### Variables

* [ODIS_MINIMUM_CELO_BALANCE](_identity_odis_phone_number_identifier_.md#const-odis_minimum_celo_balance)
* [ODIS_MINIMUM_DOLLAR_BALANCE](_identity_odis_phone_number_identifier_.md#const-odis_minimum_dollar_balance)

### Functions

* [getPepperFromThresholdSignature](_identity_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_identity_odis_phone_number_identifier_.md#getphonenumberidentifier)
* [isBalanceSufficientForSigRetrieval](_identity_odis_phone_number_identifier_.md#isbalancesufficientforsigretrieval)

## Variables

### `Const` ODIS_MINIMUM_CELO_BALANCE

• **ODIS_MINIMUM_CELO_BALANCE**: *0.005* = 0.005

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L18)*

___

### `Const` ODIS_MINIMUM_DOLLAR_BALANCE

• **ODIS_MINIMUM_DOLLAR_BALANCE**: *0.01* = 0.01

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L16)*

## Functions

###  getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**(`sigBuf`: Buffer): *string*

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L87)*

**Parameters:**

Name | Type |
------ | ------ |
`sigBuf` | Buffer |

**Returns:** *string*

___

###  getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](../interfaces/_identity_odis_query_.servicecontext.md), `selfPhoneHash?`: undefined | string, `clientVersion?`: undefined | string, `blsBlindingClient?`: [BlsBlindingClient](../interfaces/_identity_odis_bls_blinding_client_.blsblindingclient.md)): *Promise‹[PhoneNumberHashDetails](../interfaces/_identity_odis_phone_number_identifier_.phonenumberhashdetails.md)›*

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L35)*

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

___

###  isBalanceSufficientForSigRetrieval

▸ **isBalanceSufficientForSigRetrieval**(`dollarBalance`: BigNumber.Value, `celoBalance`: BigNumber.Value): *boolean*

*Defined in [contractkit/src/identity/odis/phone-number-identifier.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/phone-number-identifier.ts#L98)*

Check if balance is sufficient for quota retrieval

**Parameters:**

Name | Type |
------ | ------ |
`dollarBalance` | BigNumber.Value |
`celoBalance` | BigNumber.Value |

**Returns:** *boolean*
