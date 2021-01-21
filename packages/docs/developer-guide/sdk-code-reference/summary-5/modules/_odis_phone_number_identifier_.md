# odis/phone-number-identifier

## Index

### Interfaces

* [PhoneNumberHashDetails]()

### Variables

* [ODIS\_MINIMUM\_CELO\_BALANCE](_odis_phone_number_identifier_.md#const-odis_minimum_celo_balance)
* [ODIS\_MINIMUM\_DOLLAR\_BALANCE](_odis_phone_number_identifier_.md#const-odis_minimum_dollar_balance)

### Functions

* [getBlindedPhoneNumber](_odis_phone_number_identifier_.md#getblindedphonenumber)
* [getBlindedPhoneNumberSignature](_odis_phone_number_identifier_.md#getblindedphonenumbersignature)
* [getPepperFromThresholdSignature](_odis_phone_number_identifier_.md#getpepperfromthresholdsignature)
* [getPhoneNumberIdentifier](_odis_phone_number_identifier_.md#getphonenumberidentifier)
* [getPhoneNumberIdentifierFromSignature](_odis_phone_number_identifier_.md#getphonenumberidentifierfromsignature)
* [isBalanceSufficientForSigRetrieval](_odis_phone_number_identifier_.md#isbalancesufficientforsigretrieval)

## Variables

### `Const` ODIS\_MINIMUM\_CELO\_BALANCE

• **ODIS\_MINIMUM\_CELO\_BALANCE**: _0.005_ = 0.005

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:18_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L18)

### `Const` ODIS\_MINIMUM\_DOLLAR\_BALANCE

• **ODIS\_MINIMUM\_DOLLAR\_BALANCE**: _0.01_ = 0.01

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:16_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L16)

## Functions

### getBlindedPhoneNumber

▸ **getBlindedPhoneNumber**\(`e164Number`: string, `blsBlindingClient`: [BlsBlindingClient]()\): _Promise‹string›_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L76)

Blinds the phone number in preparation for the ODIS request Caller should use the same blsBlindingClient instance for unblinding

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164Number` | string |
| `blsBlindingClient` | [BlsBlindingClient]() |

**Returns:** _Promise‹string›_

### getBlindedPhoneNumberSignature

▸ **getBlindedPhoneNumberSignature**\(`account`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](), `base64BlindedMessage`: string, `selfPhoneHash?`: undefined \| string, `clientVersion?`: undefined \| string, `sessionID?`: undefined \| string\): _Promise‹string›_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L90)

Query ODIS for the blinded signature Response can be passed into getPhoneNumberIdentifierFromSignature to retrieve the on-chain identifier

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | string |
| `signer` | [AuthSigner](_odis_query_.md#authsigner) |
| `context` | [ServiceContext]() |
| `base64BlindedMessage` | string |
| `selfPhoneHash?` | undefined \| string |
| `clientVersion?` | undefined \| string |
| `sessionID?` | undefined \| string |

**Returns:** _Promise‹string›_

### getPepperFromThresholdSignature

▸ **getPepperFromThresholdSignature**\(`sigBuf`: Buffer\): _string_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:141_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L141)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sigBuf` | Buffer |

**Returns:** _string_

### getPhoneNumberIdentifier

▸ **getPhoneNumberIdentifier**\(`e164Number`: string, `account`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](), `selfPhoneHash?`: undefined \| string, `clientVersion?`: undefined \| string, `blsBlindingClient?`: [BlsBlindingClient](), `sessionID?`: undefined \| string\): _Promise‹_[_PhoneNumberHashDetails_]()_›_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L36)

Retrieve the on-chain identifier for the provided phone number Performs blinding, querying, and unblinding

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164Number` | string |
| `account` | string |
| `signer` | [AuthSigner](_odis_query_.md#authsigner) |
| `context` | [ServiceContext]() |
| `selfPhoneHash?` | undefined \| string |
| `clientVersion?` | undefined \| string |
| `blsBlindingClient?` | [BlsBlindingClient]() |
| `sessionID?` | undefined \| string |

**Returns:** _Promise‹_[_PhoneNumberHashDetails_]()_›_

### getPhoneNumberIdentifierFromSignature

▸ **getPhoneNumberIdentifierFromSignature**\(`e164Number`: string, `base64BlindedSignature`: string, `blsBlindingClient`: [BlsBlindingClient]()\): _Promise‹_[_PhoneNumberHashDetails_]()_›_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:124_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L124)

Unblind the response and return the on-chain identifier

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164Number` | string |
| `base64BlindedSignature` | string |
| `blsBlindingClient` | [BlsBlindingClient]() |

**Returns:** _Promise‹_[_PhoneNumberHashDetails_]()_›_

### isBalanceSufficientForSigRetrieval

▸ **isBalanceSufficientForSigRetrieval**\(`dollarBalance`: BigNumber.Value, `celoBalance`: BigNumber.Value\): _boolean_

_Defined in_ [_packages/sdk/identity/src/odis/phone-number-identifier.ts:152_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/phone-number-identifier.ts#L152)

Check if balance is sufficient for quota retrieval

**Parameters:**

| Name | Type |
| :--- | :--- |
| `dollarBalance` | BigNumber.Value |
| `celoBalance` | BigNumber.Value |

**Returns:** _boolean_

