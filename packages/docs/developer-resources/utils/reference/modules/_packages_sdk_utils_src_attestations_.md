# Module: "packages/sdk/utils/src/attestations"

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
* [getAttestationMessageToSignFromIdentifier](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromidentifier)
* [getAttestationMessageToSignFromPhoneNumber](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromphonenumber)
* [hashIdentifier](_packages_sdk_utils_src_attestations_.md#hashidentifier)

### Object literals

* [AttestationUtils](_packages_sdk_utils_src_attestations_.md#const-attestationutils)

## References

###  AttestationsStatus

• **AttestationsStatus**:

___

###  IdentifierType

• **IdentifierType**:

___

###  base64ToHex

• **base64ToHex**:

___

###  extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**:

___

###  getIdentifierPrefix

• **getIdentifierPrefix**:

___

###  isAccountConsideredVerified

• **isAccountConsideredVerified**:

___

###  messageContainsAttestationCode

• **messageContainsAttestationCode**:

___

###  sanitizeMessageBase64

• **sanitizeMessageBase64**:

## Functions

###  attestToIdentifier

▸ **attestToIdentifier**(`identifier`: string, `account`: string, `privateKey`: string): *Signature*

*Defined in [packages/sdk/utils/src/attestations.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | string |
`privateKey` | string |

**Returns:** *Signature*

___

###  getAttestationMessageToSignFromIdentifier

▸ **getAttestationMessageToSignFromIdentifier**(`identifier`: string, `account`: string): *string*

*Defined in [packages/sdk/utils/src/attestations.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`account` | string |

**Returns:** *string*

___

###  getAttestationMessageToSignFromPhoneNumber

▸ **getAttestationMessageToSignFromPhoneNumber**(`phoneNumber`: string, `account`: string, `phoneSalt?`: undefined | string): *string*

*Defined in [packages/sdk/utils/src/attestations.ts:41](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L41)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`account` | string |
`phoneSalt?` | undefined &#124; string |

**Returns:** *string*

___

###  hashIdentifier

▸ **hashIdentifier**(`identifier`: string, `type`: [IdentifierType](_packages_sdk_utils_src_attestations_.md#identifiertype), `salt?`: undefined | string): *string*

*Defined in [packages/sdk/utils/src/attestations.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`identifier` | string |
`type` | [IdentifierType](_packages_sdk_utils_src_attestations_.md#identifiertype) |
`salt?` | undefined &#124; string |

**Returns:** *string*

## Object literals

### `Const` AttestationUtils

### ▪ **AttestationUtils**: *object*

*Defined in [packages/sdk/utils/src/attestations.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L66)*

###  IdentifierType

• **IdentifierType**: *IdentifierType*

*Defined in [packages/sdk/utils/src/attestations.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L67)*

###  attestToIdentifier

• **attestToIdentifier**: *[attestToIdentifier](_packages_sdk_utils_src_attestations_.md#attesttoidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:73](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L73)*

###  base64ToHex

• **base64ToHex**: *base64ToHex*

*Defined in [packages/sdk/utils/src/attestations.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L72)*

###  extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**: *extractAttestationCodeFromMessage*

*Defined in [packages/sdk/utils/src/attestations.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L76)*

###  getAttestationMessageToSignFromIdentifier

• **getAttestationMessageToSignFromIdentifier**: *[getAttestationMessageToSignFromIdentifier](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L70)*

###  getAttestationMessageToSignFromPhoneNumber

• **getAttestationMessageToSignFromPhoneNumber**: *[getAttestationMessageToSignFromPhoneNumber](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromphonenumber)*

*Defined in [packages/sdk/utils/src/attestations.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L71)*

###  getIdentifierPrefix

• **getIdentifierPrefix**: *getIdentifierPrefix*

*Defined in [packages/sdk/utils/src/attestations.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L68)*

###  hashIdentifier

• **hashIdentifier**: *[hashIdentifier](_packages_sdk_utils_src_attestations_.md#hashidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L69)*

###  isAccountConsideredVerified

• **isAccountConsideredVerified**: *isAccountConsideredVerified*

*Defined in [packages/sdk/utils/src/attestations.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L77)*

###  messageContainsAttestationCode

• **messageContainsAttestationCode**: *messageContainsAttestationCode*

*Defined in [packages/sdk/utils/src/attestations.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L75)*

###  sanitizeMessageBase64

• **sanitizeMessageBase64**: *sanitizeMessageBase64*

*Defined in [packages/sdk/utils/src/attestations.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L74)*
