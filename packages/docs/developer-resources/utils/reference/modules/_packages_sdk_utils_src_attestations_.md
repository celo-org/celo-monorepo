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
* [extractSecurityCodeWithPrefix](_packages_sdk_utils_src_attestations_.md#extractsecuritycodewithprefix)
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

###  extractSecurityCodeWithPrefix

▸ **extractSecurityCodeWithPrefix**(`message`: string): *null | string*

*Defined in [packages/sdk/utils/src/attestations.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`message` | string |

**Returns:** *null | string*

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

*Defined in [packages/sdk/utils/src/attestations.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L74)*

###  IdentifierType

• **IdentifierType**: *IdentifierType*

*Defined in [packages/sdk/utils/src/attestations.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L75)*

###  attestToIdentifier

• **attestToIdentifier**: *[attestToIdentifier](_packages_sdk_utils_src_attestations_.md#attesttoidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:81](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L81)*

###  base64ToHex

• **base64ToHex**: *base64ToHex*

*Defined in [packages/sdk/utils/src/attestations.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L80)*

###  extractAttestationCodeFromMessage

• **extractAttestationCodeFromMessage**: *extractAttestationCodeFromMessage*

*Defined in [packages/sdk/utils/src/attestations.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L84)*

###  extractSecurityCodeWithPrefix

• **extractSecurityCodeWithPrefix**: *[extractSecurityCodeWithPrefix](_packages_sdk_utils_src_attestations_.md#extractsecuritycodewithprefix)*

*Defined in [packages/sdk/utils/src/attestations.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L86)*

###  getAttestationMessageToSignFromIdentifier

• **getAttestationMessageToSignFromIdentifier**: *[getAttestationMessageToSignFromIdentifier](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L78)*

###  getAttestationMessageToSignFromPhoneNumber

• **getAttestationMessageToSignFromPhoneNumber**: *[getAttestationMessageToSignFromPhoneNumber](_packages_sdk_utils_src_attestations_.md#getattestationmessagetosignfromphonenumber)*

*Defined in [packages/sdk/utils/src/attestations.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L79)*

###  getIdentifierPrefix

• **getIdentifierPrefix**: *getIdentifierPrefix*

*Defined in [packages/sdk/utils/src/attestations.ts:76](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L76)*

###  hashIdentifier

• **hashIdentifier**: *[hashIdentifier](_packages_sdk_utils_src_attestations_.md#hashidentifier)*

*Defined in [packages/sdk/utils/src/attestations.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L77)*

###  isAccountConsideredVerified

• **isAccountConsideredVerified**: *isAccountConsideredVerified*

*Defined in [packages/sdk/utils/src/attestations.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L85)*

###  messageContainsAttestationCode

• **messageContainsAttestationCode**: *messageContainsAttestationCode*

*Defined in [packages/sdk/utils/src/attestations.ts:83](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L83)*

###  sanitizeMessageBase64

• **sanitizeMessageBase64**: *sanitizeMessageBase64*

*Defined in [packages/sdk/utils/src/attestations.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/attestations.ts#L82)*
