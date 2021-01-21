# attestations

## Index

### Enumerations

* [IdentifierType]()

### Interfaces

* [AttestationsStatus]()

### Functions

* [base64ToHex](_attestations_.md#base64tohex)
* [extractAttestationCodeFromMessage](_attestations_.md#extractattestationcodefrommessage)
* [getIdentifierPrefix](_attestations_.md#getidentifierprefix)
* [hashIdentifier](_attestations_.md#hashidentifier)
* [isAccountConsideredVerified](_attestations_.md#isaccountconsideredverified)
* [messageContainsAttestationCode](_attestations_.md#messagecontainsattestationcode)
* [sanitizeMessageBase64](_attestations_.md#sanitizemessagebase64)

### Object literals

* [AttestationBase](_attestations_.md#const-attestationbase)

## Functions

### base64ToHex

▸ **base64ToHex**\(`base64String`: string\): _string_

_Defined in_ [_packages/sdk/base/src/attestations.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L36)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64String` | string |

**Returns:** _string_

### extractAttestationCodeFromMessage

▸ **extractAttestationCodeFromMessage**\(`message`: string\): _null \| string_

_Defined in_ [_packages/sdk/base/src/attestations.ts:53_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L53)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |

**Returns:** _null \| string_

### getIdentifierPrefix

▸ **getIdentifierPrefix**\(`type`: [IdentifierType]()\): _string_

_Defined in_ [_packages/sdk/base/src/attestations.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L13)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | [IdentifierType]() |

**Returns:** _string_

### hashIdentifier

▸ **hashIdentifier**\(`sha3`: function, `identifier`: string, `type`: [IdentifierType](), `salt?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/base/src/attestations.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L22)

**Parameters:**

▪ **sha3**: _function_

▸ \(`a`: string\): _string \| null_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | string |

▪ **identifier**: _string_

▪ **type**: [_IdentifierType_]()

▪`Optional` **salt**: _undefined \| string_

**Returns:** _string_

### isAccountConsideredVerified

▸ **isAccountConsideredVerified**\(`stats`: AttestationStat \| undefined, `numAttestationsRequired`: number, `attestationThreshold`: number\): [_AttestationsStatus_]()

_Defined in_ [_packages/sdk/base/src/attestations.ts:88_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L88)

Returns true if an AttestationStat is considered verified using the given factors, or defaults if factors are ommited.

**Parameters:**

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `stats` | AttestationStat \| undefined | - | AttestationStat of the account's attestation identitifer, retrievable via lookupIdentitfiers |
| `numAttestationsRequired` | number | DEFAULT\_NUM\_ATTESTATIONS\_REQUIRED | Optional number of attestations required.  Will default to  hardcoded value if absent. |
| `attestationThreshold` | number | DEFAULT\_ATTESTATION\_THRESHOLD | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent. |

**Returns:** [_AttestationsStatus_]()

### messageContainsAttestationCode

▸ **messageContainsAttestationCode**\(`message`: string\): _boolean_

_Defined in_ [_packages/sdk/base/src/attestations.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L49)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `message` | string |

**Returns:** _boolean_

### sanitizeMessageBase64

▸ **sanitizeMessageBase64**\(`base64String`: string\): _string_

_Defined in_ [_packages/sdk/base/src/attestations.ts:40_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L40)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `base64String` | string |

**Returns:** _string_

## Object literals

### `Const` AttestationBase

### ▪ **AttestationBase**: _object_

_Defined in_ [_packages/sdk/base/src/attestations.ts:115_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L115)

### IdentifierType

• **IdentifierType**: [_IdentifierType_]()

_Defined in_ [_packages/sdk/base/src/attestations.ts:116_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L116)

### base64ToHex

• **base64ToHex**: [_base64ToHex_](_attestations_.md#base64tohex)

_Defined in_ [_packages/sdk/base/src/attestations.ts:119_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L119)

### extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**: [_extractAttestationCodeFromMessage_](_attestations_.md#extractattestationcodefrommessage)

_Defined in_ [_packages/sdk/base/src/attestations.ts:122_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L122)

### getIdentifierPrefix

• **getIdentifierPrefix**: [_getIdentifierPrefix_](_attestations_.md#getidentifierprefix)

_Defined in_ [_packages/sdk/base/src/attestations.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L117)

### hashIdentifier

• **hashIdentifier**: [_hashIdentifier_](_attestations_.md#hashidentifier)

_Defined in_ [_packages/sdk/base/src/attestations.ts:118_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L118)

### isAccountConsideredVerified

• **isAccountConsideredVerified**: [_isAccountConsideredVerified_](_attestations_.md#isaccountconsideredverified)

_Defined in_ [_packages/sdk/base/src/attestations.ts:123_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L123)

### messageContainsAttestationCode

• **messageContainsAttestationCode**: [_messageContainsAttestationCode_](_attestations_.md#messagecontainsattestationcode)

_Defined in_ [_packages/sdk/base/src/attestations.ts:121_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L121)

### sanitizeMessageBase64

• **sanitizeMessageBase64**: [_sanitizeMessageBase64_](_attestations_.md#sanitizemessagebase64)

_Defined in_ [_packages/sdk/base/src/attestations.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L120)

