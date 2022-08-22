# Module: "phoneNumbers"

## Index

### References

* [ParsedPhoneNumber](_phonenumbers_.md#parsedphonenumber)
* [anonymizedPhone](_phonenumbers_.md#anonymizedphone)
* [isE164Number](_phonenumbers_.md#ise164number)

### Functions

* [getCountryCode](_phonenumbers_.md#getcountrycode)
* [getCountryEmoji](_phonenumbers_.md#getcountryemoji)
* [getDisplayNumberInternational](_phonenumbers_.md#getdisplaynumberinternational)
* [getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)
* [getE164DisplayNumber](_phonenumbers_.md#gete164displaynumber)
* [getE164Number](_phonenumbers_.md#gete164number)
* [getExampleNumber](_phonenumbers_.md#getexamplenumber)
* [getPhoneHash](_phonenumbers_.md#const-getphonehash)
* [getRegionCode](_phonenumbers_.md#getregioncode)
* [getRegionCodeFromCountryCode](_phonenumbers_.md#getregioncodefromcountrycode)
* [isE164NumberStrict](_phonenumbers_.md#ise164numberstrict)
* [parsePhoneNumber](_phonenumbers_.md#parsephonenumber)

### Object literals

* [PhoneNumberUtils](_phonenumbers_.md#const-phonenumberutils)

## References

###  ParsedPhoneNumber

• **ParsedPhoneNumber**:

___

###  anonymizedPhone

• **anonymizedPhone**:

___

###  isE164Number

• **isE164Number**:

## Functions

###  getCountryCode

▸ **getCountryCode**(`e164PhoneNumber`: string): *undefined | null | number*

*Defined in [phoneNumbers.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *undefined | null | number*

___

###  getCountryEmoji

▸ **getCountryEmoji**(`e164PhoneNumber`: string, `countryCodePossible?`: undefined | number, `regionCodePossible?`: undefined | string): *string*

*Defined in [phoneNumbers.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |
`countryCodePossible?` | undefined &#124; number |
`regionCodePossible?` | undefined &#124; string |

**Returns:** *string*

___

###  getDisplayNumberInternational

▸ **getDisplayNumberInternational**(`e164PhoneNumber`: string): *string*

*Defined in [phoneNumbers.ts:94](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L94)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *string*

___

###  getDisplayPhoneNumber

▸ **getDisplayPhoneNumber**(`phoneNumber`: string, `defaultCountryCode`: string): *string*

*Defined in [phoneNumbers.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *string*

___

###  getE164DisplayNumber

▸ **getE164DisplayNumber**(`e164PhoneNumber`: string): *string*

*Defined in [phoneNumbers.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L105)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *string*

___

###  getE164Number

▸ **getE164Number**(`phoneNumber`: string, `defaultCountryCode`: string): *null | string*

*Defined in [phoneNumbers.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L110)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *null | string*

___

###  getExampleNumber

▸ **getExampleNumber**(`regionCode`: string, `useOnlyZeroes`: boolean, `isInternational`: boolean): *undefined | string*

*Defined in [phoneNumbers.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L247)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`regionCode` | string | - |
`useOnlyZeroes` | boolean | true |
`isInternational` | boolean | false |

**Returns:** *undefined | string*

___

### `Const` getPhoneHash

▸ **getPhoneHash**(`phoneNumber`: string, `salt?`: undefined | string): *string*

*Defined in [phoneNumbers.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`salt?` | undefined &#124; string |

**Returns:** *string*

___

###  getRegionCode

▸ **getRegionCode**(`e164PhoneNumber`: string): *undefined | null | string*

*Defined in [phoneNumbers.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *undefined | null | string*

___

###  getRegionCodeFromCountryCode

▸ **getRegionCodeFromCountryCode**(`countryCode`: string): *null | string*

*Defined in [phoneNumbers.ts:72](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`countryCode` | string |

**Returns:** *null | string*

___

###  isE164NumberStrict

▸ **isE164NumberStrict**(`phoneNumber`: string): *boolean*

*Defined in [phoneNumbers.ts:120](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L120)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |

**Returns:** *boolean*

___

###  parsePhoneNumber

▸ **parsePhoneNumber**(`phoneNumberRaw`: string, `defaultCountryCode?`: undefined | string): *ParsedPhoneNumber | null*

*Defined in [phoneNumbers.ts:132](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L132)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumberRaw` | string |
`defaultCountryCode?` | undefined &#124; string |

**Returns:** *ParsedPhoneNumber | null*

## Object literals

### `Const` PhoneNumberUtils

### ▪ **PhoneNumberUtils**: *object*

*Defined in [phoneNumbers.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L275)*

###  getCountryCode

• **getCountryCode**: *[getCountryCode](_phonenumbers_.md#getcountrycode)*

*Defined in [phoneNumbers.ts:277](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L277)*

###  getDisplayPhoneNumber

• **getDisplayPhoneNumber**: *[getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)*

*Defined in [phoneNumbers.ts:279](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L279)*

###  getE164Number

• **getE164Number**: *[getE164Number](_phonenumbers_.md#gete164number)*

*Defined in [phoneNumbers.ts:280](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L280)*

###  getPhoneHash

• **getPhoneHash**: *getPhoneHash*

*Defined in [phoneNumbers.ts:276](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L276)*

###  getRegionCode

• **getRegionCode**: *[getRegionCode](_phonenumbers_.md#getregioncode)*

*Defined in [phoneNumbers.ts:278](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L278)*

###  isE164Number

• **isE164Number**: *isE164Number*

*Defined in [phoneNumbers.ts:281](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L281)*

###  parsePhoneNumber

• **parsePhoneNumber**: *[parsePhoneNumber](_phonenumbers_.md#parsephonenumber)*

*Defined in [phoneNumbers.ts:282](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L282)*
