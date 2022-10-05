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

▸ **getCountryCode**(`e164PhoneNumber`: string): *undefined | null | number*

*Defined in [phoneNumbers.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *undefined | null | number*

___

###  getDisplayNumberInternational

▸ **getDisplayNumberInternational**(`e164PhoneNumber`: string): *string*

*Defined in [phoneNumbers.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *string*

___

###  getDisplayPhoneNumber

▸ **getDisplayPhoneNumber**(`phoneNumber`: string, `defaultCountryCode`: string): *string*

*Defined in [phoneNumbers.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *string*

___

###  getE164DisplayNumber

▸ **getE164DisplayNumber**(`e164PhoneNumber`: string): *string*

*Defined in [phoneNumbers.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *string*

___

###  getE164Number

▸ **getE164Number**(`phoneNumber`: string, `defaultCountryCode`: string): *null | string*

*Defined in [phoneNumbers.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |
`defaultCountryCode` | string |

**Returns:** *null | string*

___

###  getExampleNumber

▸ **getExampleNumber**(`regionCode`: string, `useOnlyZeroes`: boolean, `isInternational`: boolean): *undefined | string*

*Defined in [phoneNumbers.ts:212](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L212)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`regionCode` | string | - |
`useOnlyZeroes` | boolean | true |
`isInternational` | boolean | false |

**Returns:** *undefined | string*

___

###  getRegionCode

▸ **getRegionCode**(`e164PhoneNumber`: string): *undefined | null | string*

*Defined in [phoneNumbers.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`e164PhoneNumber` | string |

**Returns:** *undefined | null | string*

___

###  getRegionCodeFromCountryCode

▸ **getRegionCodeFromCountryCode**(`countryCode`: string): *null | string*

*Defined in [phoneNumbers.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`countryCode` | string |

**Returns:** *null | string*

___

###  isE164NumberStrict

▸ **isE164NumberStrict**(`phoneNumber`: string): *boolean*

*Defined in [phoneNumbers.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L85)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |

**Returns:** *boolean*

___

###  parsePhoneNumber

▸ **parsePhoneNumber**(`phoneNumberRaw`: string, `defaultCountryCode?`: undefined | string): *ParsedPhoneNumber | null*

*Defined in [phoneNumbers.ts:97](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L97)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumberRaw` | string |
`defaultCountryCode?` | undefined &#124; string |

**Returns:** *ParsedPhoneNumber | null*

## Object literals

### `Const` PhoneNumberUtils

### ▪ **PhoneNumberUtils**: *object*

*Defined in [phoneNumbers.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L240)*

###  getCountryCode

• **getCountryCode**: *[getCountryCode](_phonenumbers_.md#getcountrycode)*

*Defined in [phoneNumbers.ts:242](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L242)*

###  getDisplayPhoneNumber

• **getDisplayPhoneNumber**: *[getDisplayPhoneNumber](_phonenumbers_.md#getdisplayphonenumber)*

*Defined in [phoneNumbers.ts:244](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L244)*

###  getE164Number

• **getE164Number**: *[getE164Number](_phonenumbers_.md#gete164number)*

*Defined in [phoneNumbers.ts:245](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L245)*

###  getPhoneHash

• **getPhoneHash**: *getPhoneHash*

*Defined in [phoneNumbers.ts:241](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L241)*

###  getRegionCode

• **getRegionCode**: *[getRegionCode](_phonenumbers_.md#getregioncode)*

*Defined in [phoneNumbers.ts:243](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L243)*

###  isE164Number

• **isE164Number**: *isE164Number*

*Defined in [phoneNumbers.ts:246](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L246)*

###  parsePhoneNumber

• **parsePhoneNumber**: *[parsePhoneNumber](_phonenumbers_.md#parsephonenumber)*

*Defined in [phoneNumbers.ts:247](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/phoneNumbers.ts#L247)*
