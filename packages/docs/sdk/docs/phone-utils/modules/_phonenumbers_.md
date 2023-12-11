[@celo/phone-utils](../README.md) › [Globals](../globals.md) › ["phoneNumbers"](_phonenumbers_.md)

# Module: "phoneNumbers"

## Index

### Functions

* [getCountryCode](_phonenumbers_.md#getcountrycode)
* [getDisplayNumberInternational](_phonenumbers_.md#getdisplaynumberinternational)
* [getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)
* [getE164DisplayNumber](_phonenumbers_.md#gete164displaynumber)
* [getE164Number](_phonenumbers_.md#gete164number)
* [getExampleNumber](_phonenumbers_.md#getexamplenumber)
* [getRegionCode](_phonenumbers_.md#getregioncode)
* [getRegionCodeFromCountryCode](_phonenumbers_.md#getregioncodefromcountrycode)
* [isE164NumberStrict](_phonenumbers_.md#ise164numberstrict)
* [parsePhoneNumber](_phonenumbers_.md#parsephonenumber)

### Object literals

* [PhoneNumberUtils](_phonenumbers_.md#const-phonenumberutils)

## Functions

###  getCountryCode

▸ **getCountryCode**(`e164PhoneNumber`: string): *[getCountryCode](_phonenumbers_.md#getcountrycode)*

*Defined in [phoneNumbers.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *[getCountryCode](_phonenumbers_.md#getcountrycode)*

___

###  getDisplayNumberInternational

▸ **getDisplayNumberInternational**(`e164PhoneNumber`: string): *[getDisplayNumberInternational](_phonenumbers_.md#getdisplaynumberinternational)*

*Defined in [phoneNumbers.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *[getDisplayNumberInternational](_phonenumbers_.md#getdisplaynumberinternational)*

___

###  getDisplayPhoneNumber

▸ **getDisplayPhoneNumber**(`phoneNumber`: string, `defaultCountryCode`: string): *[getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)*

*Defined in [phoneNumbers.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *[getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)*

___

###  getE164DisplayNumber

▸ **getE164DisplayNumber**(`e164PhoneNumber`: string): *[getE164DisplayNumber](_phonenumbers_.md#gete164displaynumber)*

*Defined in [phoneNumbers.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *[getE164DisplayNumber](_phonenumbers_.md#gete164displaynumber)*

___

###  getE164Number

▸ **getE164Number**(`phoneNumber`: string, `defaultCountryCode`: string): *[getE164Number](_phonenumbers_.md#gete164number)*

*Defined in [phoneNumbers.ts:74](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L74)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *[getE164Number](_phonenumbers_.md#gete164number)*

___

###  getExampleNumber

▸ **getExampleNumber**(`regionCode`: string, `useOnlyZeroes`: boolean, `isInternational`: boolean): *[getExampleNumber](_phonenumbers_.md#getexamplenumber)*

*Defined in [phoneNumbers.ts:211](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L211)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`regionCode` | string | - |
`useOnlyZeroes` | boolean | true |
`isInternational` | boolean | false |

**Returns:** *[getExampleNumber](_phonenumbers_.md#getexamplenumber)*

___

###  getRegionCode

▸ **getRegionCode**(`e164PhoneNumber`: string): *[getRegionCode](_phonenumbers_.md#getregioncode)*

*Defined in [phoneNumbers.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *[getRegionCode](_phonenumbers_.md#getregioncode)*

___

###  getRegionCodeFromCountryCode

▸ **getRegionCodeFromCountryCode**(`countryCode`: string): *[getRegionCodeFromCountryCode](_phonenumbers_.md#getregioncodefromcountrycode)*

*Defined in [phoneNumbers.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`countryCode` | string |

**Returns:** *[getRegionCodeFromCountryCode](_phonenumbers_.md#getregioncodefromcountrycode)*

___

###  isE164NumberStrict

▸ **isE164NumberStrict**(`phoneNumber`: string): *[isE164NumberStrict](_phonenumbers_.md#ise164numberstrict)*

*Defined in [phoneNumbers.ts:84](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L84)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |

**Returns:** *[isE164NumberStrict](_phonenumbers_.md#ise164numberstrict)*

___

###  parsePhoneNumber

▸ **parsePhoneNumber**(`phoneNumberRaw`: string, `defaultCountryCode?`: undefined | string): *ParsedPhoneNumber | null*

*Defined in [phoneNumbers.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L96)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumberRaw` | string |
`defaultCountryCode?` | undefined &#124; string |

**Returns:** *ParsedPhoneNumber | null*

## Object literals

### `Const` PhoneNumberUtils

### ▪ **PhoneNumberUtils**: *object*

*Defined in [phoneNumbers.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L239)*

###  getCountryCode

• **getCountryCode**: *[getCountryCode](_phonenumbers_.md#getcountrycode)*

*Defined in [phoneNumbers.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L240)*

###  getDisplayPhoneNumber

• **getDisplayPhoneNumber**: *[getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)*

*Defined in [phoneNumbers.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L242)*

###  getE164Number

• **getE164Number**: *[getE164Number](_phonenumbers_.md#gete164number)*

*Defined in [phoneNumbers.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L243)*

###  getRegionCode

• **getRegionCode**: *[getRegionCode](_phonenumbers_.md#getregioncode)*

*Defined in [phoneNumbers.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L241)*

###  isE164Number

• **isE164Number**: *isE164Number*

*Defined in [phoneNumbers.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L244)*

###  parsePhoneNumber

• **parsePhoneNumber**: *[parsePhoneNumber](_phonenumbers_.md#parsephonenumber)*

*Defined in [phoneNumbers.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L245)*
