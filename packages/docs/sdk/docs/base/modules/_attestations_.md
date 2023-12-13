[@celo/base](../README.md) › ["attestations"](_attestations_.md)

# Module: "attestations"

## Index

### Enumerations

* [IdentifierType](../enums/_attestations_.identifiertype.md)

### Interfaces

* [AttestationsStatus](../interfaces/_attestations_.attestationsstatus.md)

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

###  base64ToHex

▸ **base64ToHex**(`base64String`: string): *string*

*Defined in [packages/sdk/base/src/attestations.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`base64String` | string |

**Returns:** *string*

___

###  extractAttestationCodeFromMessage

▸ **extractAttestationCodeFromMessage**(`message`: string): *null | string*

*Defined in [packages/sdk/base/src/attestations.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *null | string*

___

###  getIdentifierPrefix

▸ **getIdentifierPrefix**(`type`: [IdentifierType](../enums/_attestations_.identifiertype.md)): *string*

*Defined in [packages/sdk/base/src/attestations.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [IdentifierType](../enums/_attestations_.identifiertype.md) |

**Returns:** *string*

___

###  hashIdentifier

▸ **hashIdentifier**(`sha3`: function, `identifier`: string, `type`: [IdentifierType](../enums/_attestations_.identifiertype.md), `salt?`: undefined | string): *string*

*Defined in [packages/sdk/base/src/attestations.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L22)*

**Parameters:**

▪ **sha3**: *function*

▸ (`a`: string): *string | null*

**Parameters:**

Name | Type |
------ | ------ |
`a` | string |

▪ **identifier**: *string*

▪ **type**: *[IdentifierType](../enums/_attestations_.identifiertype.md)*

▪`Optional`  **salt**: *undefined | string*

**Returns:** *string*

___

###  isAccountConsideredVerified

▸ **isAccountConsideredVerified**(`stats`: AttestationStat | undefined, `numAttestationsRequired`: number, `attestationThreshold`: number): *[AttestationsStatus](../interfaces/_attestations_.attestationsstatus.md)*

*Defined in [packages/sdk/base/src/attestations.ts:88](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L88)*

Returns true if an AttestationStat is considered verified using the given factors,
or defaults if factors are ommited.

**Parameters:**

Name | Type | Default | Description |
------ | ------ | ------ | ------ |
`stats` | AttestationStat &#124; undefined | - | AttestationStat of the account's attestation identitifer, retrievable via lookupIdentitfiers |
`numAttestationsRequired` | number | DEFAULT_NUM_ATTESTATIONS_REQUIRED | Optional number of attestations required.  Will default to  hardcoded value if absent. |
`attestationThreshold` | number | DEFAULT_ATTESTATION_THRESHOLD | Optional threshold for fraction attestations completed. Will  default to hardcoded value if absent.  |

**Returns:** *[AttestationsStatus](../interfaces/_attestations_.attestationsstatus.md)*

___

###  messageContainsAttestationCode

▸ **messageContainsAttestationCode**(`message`: string): *boolean*

*Defined in [packages/sdk/base/src/attestations.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *boolean*

___

###  sanitizeMessageBase64

▸ **sanitizeMessageBase64**(`base64String`: string): *string*

*Defined in [packages/sdk/base/src/attestations.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`base64String` | string |

**Returns:** *string*

## Object literals

### `Const` AttestationBase

### ▪ **AttestationBase**: *object*

*Defined in [packages/sdk/base/src/attestations.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L115)*

###  IdentifierType

• **IdentifierType**: *[IdentifierType](../enums/_attestations_.identifiertype.md)*

*Defined in [packages/sdk/base/src/attestations.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L116)*

###  base64ToHex

• **base64ToHex**: *[base64ToHex](_attestations_.md#base64tohex)*

*Defined in [packages/sdk/base/src/attestations.ts:119](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L119)*

###  extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**: *[extractAttestationCodeFromMessage](_attestations_.md#extractattestationcodefrommessage)*

*Defined in [packages/sdk/base/src/attestations.ts:122](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L122)*

###  getIdentifierPrefix

• **getIdentifierPrefix**: *[getIdentifierPrefix](_attestations_.md#getidentifierprefix)*

*Defined in [packages/sdk/base/src/attestations.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L117)*

###  hashIdentifier

• **hashIdentifier**: *[hashIdentifier](_attestations_.md#hashidentifier)*

*Defined in [packages/sdk/base/src/attestations.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L118)*

###  isAccountConsideredVerified

• **isAccountConsideredVerified**: *[isAccountConsideredVerified](_attestations_.md#isaccountconsideredverified)*

*Defined in [packages/sdk/base/src/attestations.ts:123](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L123)*

###  messageContainsAttestationCode

• **messageContainsAttestationCode**: *[messageContainsAttestationCode](_attestations_.md#messagecontainsattestationcode)*

*Defined in [packages/sdk/base/src/attestations.ts:121](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L121)*

###  sanitizeMessageBase64

• **sanitizeMessageBase64**: *[sanitizeMessageBase64](_attestations_.md#sanitizemessagebase64)*

*Defined in [packages/sdk/base/src/attestations.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/attestations.ts#L120)*
