# packages/sdk/utils/src/phoneNumbers

## Index

### References

* [ParsedPhoneNumber](_packages_sdk_utils_src_phonenumbers_.md#parsedphonenumber)
* [anonymizedPhone](_packages_sdk_utils_src_phonenumbers_.md#anonymizedphone)
* [isE164Number](_packages_sdk_utils_src_phonenumbers_.md#ise164number)

### Functions

* [getCountryCode](_packages_sdk_utils_src_phonenumbers_.md#getcountrycode)
* [getCountryEmoji](_packages_sdk_utils_src_phonenumbers_.md#getcountryemoji)
* [getDisplayNumberInternational](_packages_sdk_utils_src_phonenumbers_.md#getdisplaynumberinternational)
* [getDisplayPhoneNumber](_packages_sdk_utils_src_phonenumbers_.md#getdisplayphonenumber)
* [getE164DisplayNumber](_packages_sdk_utils_src_phonenumbers_.md#gete164displaynumber)
* [getE164Number](_packages_sdk_utils_src_phonenumbers_.md#gete164number)
* [getExampleNumber](_packages_sdk_utils_src_phonenumbers_.md#getexamplenumber)
* [getPhoneHash](_packages_sdk_utils_src_phonenumbers_.md#const-getphonehash)
* [getRegionCode](_packages_sdk_utils_src_phonenumbers_.md#getregioncode)
* [getRegionCodeFromCountryCode](_packages_sdk_utils_src_phonenumbers_.md#getregioncodefromcountrycode)
* [isE164NumberStrict](_packages_sdk_utils_src_phonenumbers_.md#ise164numberstrict)
* [parsePhoneNumber](_packages_sdk_utils_src_phonenumbers_.md#parsephonenumber)

### Object literals

* [PhoneNumberUtils](_packages_sdk_utils_src_phonenumbers_.md#const-phonenumberutils)

## References

### ParsedPhoneNumber

• **ParsedPhoneNumber**:

### anonymizedPhone

• **anonymizedPhone**:

### isE164Number

• **isE164Number**:

## Functions

### getCountryCode

▸ **getCountryCode**\(`e164PhoneNumber`: string\): _undefined \| null \| number_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:48_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L48)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164PhoneNumber` | string |

**Returns:** _undefined \| null \| number_

### getCountryEmoji

▸ **getCountryEmoji**\(`e164PhoneNumber`: string, `countryCodePossible?`: undefined \| number, `regionCodePossible?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164PhoneNumber` | string |
| `countryCodePossible?` | undefined \| number |
| `regionCodePossible?` | undefined \| string |

**Returns:** _string_

### getDisplayNumberInternational

▸ **getDisplayNumberInternational**\(`e164PhoneNumber`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:94_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L94)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164PhoneNumber` | string |

**Returns:** _string_

### getDisplayPhoneNumber

▸ **getDisplayPhoneNumber**\(`phoneNumber`: string, `defaultCountryCode`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:84_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L84)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `defaultCountryCode` | string |

**Returns:** _string_

### getE164DisplayNumber

▸ **getE164DisplayNumber**\(`e164PhoneNumber`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L105)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164PhoneNumber` | string |

**Returns:** _string_

### getE164Number

▸ **getE164Number**\(`phoneNumber`: string, `defaultCountryCode`: string\): _null \| string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:110_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L110)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `defaultCountryCode` | string |

**Returns:** _null \| string_

### getExampleNumber

▸ **getExampleNumber**\(`regionCode`: string, `useOnlyZeroes`: boolean, `isInternational`: boolean\): _undefined \| string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:247_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L247)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `regionCode` | string | - |
| `useOnlyZeroes` | boolean | true |
| `isInternational` | boolean | false |

**Returns:** _undefined \| string_

### `Const` getPhoneHash

▸ **getPhoneHash**\(`phoneNumber`: string, `salt?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |
| `salt?` | undefined \| string |

**Returns:** _string_

### getRegionCode

▸ **getRegionCode**\(`e164PhoneNumber`: string\): _undefined \| null \| string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:60_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L60)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164PhoneNumber` | string |

**Returns:** _undefined \| null \| string_

### getRegionCodeFromCountryCode

▸ **getRegionCodeFromCountryCode**\(`countryCode`: string\): _null \| string_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:72_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L72)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `countryCode` | string |

**Returns:** _null \| string_

### isE164NumberStrict

▸ **isE164NumberStrict**\(`phoneNumber`: string\): _boolean_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L120)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |

**Returns:** _boolean_

### parsePhoneNumber

▸ **parsePhoneNumber**\(`phoneNumberRaw`: string, `defaultCountryCode?`: undefined \| string\): _ParsedPhoneNumber \| null_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L132)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumberRaw` | string |
| `defaultCountryCode?` | undefined \| string |

**Returns:** _ParsedPhoneNumber \| null_

## Object literals

### `Const` PhoneNumberUtils

### ▪ **PhoneNumberUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:275_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L275)

### getCountryCode

• **getCountryCode**: [_getCountryCode_](_packages_sdk_utils_src_phonenumbers_.md#getcountrycode)

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:277_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L277)

### getDisplayPhoneNumber

• **getDisplayPhoneNumber**: [_getDisplayPhoneNumber_](_packages_sdk_utils_src_phonenumbers_.md#getdisplayphonenumber)

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:279_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L279)

### getE164Number

• **getE164Number**: [_getE164Number_](_packages_sdk_utils_src_phonenumbers_.md#gete164number)

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:280_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L280)

### getPhoneHash

• **getPhoneHash**: _getPhoneHash_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:276_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L276)

### getRegionCode

• **getRegionCode**: [_getRegionCode_](_packages_sdk_utils_src_phonenumbers_.md#getregioncode)

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:278_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L278)

### isE164Number

• **isE164Number**: _isE164Number_

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:281_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L281)

### parsePhoneNumber

• **parsePhoneNumber**: [_parsePhoneNumber_](_packages_sdk_utils_src_phonenumbers_.md#parsephonenumber)

_Defined in_ [_packages/sdk/utils/src/phoneNumbers.ts:282_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/phoneNumbers.ts#L282)

