# packages/sdk/utils/src/attestations

## Index

### References

* [AttestationsStatus](_packages_sdk_utils_src_attestations_.md#attestationsstatus)
* [IdentifierType](_packages_sdk_utils_src_attestations_.md#identifiertype)
* [base64ToHex](_packages_sdk_utils_src_attestations_.md#base64tohex)
* [extractAttestationCodeFromMessage](_packages_sdk_utils_src_attestations_.md#extractattestationcodefrommessage)
* [getIdentifierPrefix](_packages_sdk_utils_src_attestations_.md#getidentifierprefix)
* [isAccountConsideredVerified](_packages_sdk_utils_src_attestations_.md#isaccountconsideredverified)
* [messageContainsAttestationCode](_packages_sdk_utils_src_attestations_.md#messagecontainsattestationcode)
* [sanitizeMessageBase64](_packages_sdk_utils_src_attestations_.md#sanitizemessagebase64)

### Functions

* [attestToIdentifier](_packages_sdk_utils_src_attestations_.md#attesttoidentifier)
* [extractSecurityCodeWithPrefix](_packages_sdk_utils_src_attestations_.md#extractsecuritycodewithprefix)
* [getAttestationMessageToSignFromIdentifier](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromidentifier)
* [getAttestationMessageToSignFromPhoneNumber](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromphonenumber)
* [hashIdentifier](_packages_sdk_utils_src_attestations_.md#hashidentifier)

### Object literals

* [AttestationUtils](_packages_sdk_utils_src_attestations_.md#const-attestationutils)

## References

### AttestationsStatus

• **AttestationsStatus**:

### IdentifierType

• **IdentifierType**:

### base64ToHex

• **base64ToHex**:

### extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**:

### getIdentifierPrefix

• **getIdentifierPrefix**:

### isAccountConsideredVerified

• **isAccountConsideredVerified**:

### messageContainsAttestationCode

• **messageContainsAttestationCode**:

### sanitizeMessageBase64

• **sanitizeMessageBase64**:

## Functions

### attestToIdentifier

▸ **attestToIdentifier**\(`identifier`: string, `account`: string, `privateKey`: string\): _Signature_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L52)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | string |
| `privateKey` | string |

**Returns:** _Signature_

### extractSecurityCodeWithPrefix

▸ **extractSecurityCodeWithPrefix**\(`message`: string\): _null \| string_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:66_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L66)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |

**Returns:** _null \| string_

### getAttestationMessageToSignFromIdentifier

▸ **getAttestationMessageToSignFromIdentifier**\(`identifier`: string, `account`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L33)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `account` | string |

**Returns:** _string_

### getAttestationMessageToSignFromPhoneNumber

▸ **getAttestationMessageToSignFromPhoneNumber**\(`phoneNumber`: string, `account`: string, `phoneSalt?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:41_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L41)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `account` | string |
| `phoneSalt?` | undefined \| string |

**Returns:** _string_

### hashIdentifier

▸ **hashIdentifier**\(`identifier`: string, `type`: [IdentifierType](_packages_sdk_utils_src_attestations_.md#identifiertype), `salt?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L29)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `identifier` | string |
| `type` | [IdentifierType](_packages_sdk_utils_src_attestations_.md#identifiertype) |
| `salt?` | undefined \| string |

**Returns:** _string_

## Object literals

### `Const` AttestationUtils

### ▪ **AttestationUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:74_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L74)

### IdentifierType

• **IdentifierType**: _IdentifierType_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:75_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L75)

### attestToIdentifier

• **attestToIdentifier**: [_attestToIdentifier_](_packages_sdk_utils_src_attestations_.md#attesttoidentifier)

_Defined in_ [_packages/sdk/utils/src/attestations.ts:81_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L81)

### base64ToHex

• **base64ToHex**: _base64ToHex_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:80_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L80)

### extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**: _extractAttestationCodeFromMessage_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L84)

### extractSecurityCodeWithPrefix

• **extractSecurityCodeWithPrefix**: [_extractSecurityCodeWithPrefix_](_packages_sdk_utils_src_attestations_.md#extractsecuritycodewithprefix)

_Defined in_ [_packages/sdk/utils/src/attestations.ts:86_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L86)

### getAttestationMessageToSignFromIdentifier

• **getAttestationMessageToSignFromIdentifier**: [_getAttestationMessageToSignFromIdentifier_](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromidentifier)

_Defined in_ [_packages/sdk/utils/src/attestations.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L78)

### getAttestationMessageToSignFromPhoneNumber

• **getAttestationMessageToSignFromPhoneNumber**: [_getAttestationMessageToSignFromPhoneNumber_](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromphonenumber)

_Defined in_ [_packages/sdk/utils/src/attestations.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L79)

### getIdentifierPrefix

• **getIdentifierPrefix**: _getIdentifierPrefix_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:76_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L76)

### hashIdentifier

• **hashIdentifier**: [_hashIdentifier_](_packages_sdk_utils_src_attestations_.md#hashidentifier)

_Defined in_ [_packages/sdk/utils/src/attestations.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L77)

### isAccountConsideredVerified

• **isAccountConsideredVerified**: _isAccountConsideredVerified_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:85_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L85)

### messageContainsAttestationCode

• **messageContainsAttestationCode**: _messageContainsAttestationCode_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:83_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L83)

### sanitizeMessageBase64

• **sanitizeMessageBase64**: _sanitizeMessageBase64_

_Defined in_ [_packages/sdk/utils/src/attestations.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L82)

