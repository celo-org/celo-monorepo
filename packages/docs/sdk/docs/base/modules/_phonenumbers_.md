[@celo/base](../README.md) › ["phoneNumbers"](_phonenumbers_.md)

# Module: "phoneNumbers"

## Index

### Interfaces

* [ParsedPhoneNumber](../interfaces/_phonenumbers_.parsedphonenumber.md)

### Functions

* [anonymizedPhone](_phonenumbers_.md#anonymizedphone)
* [getPhoneHash](_phonenumbers_.md#const-getphonehash)
* [isE164Number](_phonenumbers_.md#ise164number)

### Object literals

* [PhoneNumberBase](_phonenumbers_.md#const-phonenumberbase)

## Functions

###  anonymizedPhone

▸ **anonymizedPhone**(`phoneNumber`: string): *[anonymizedPhone](_phonenumbers_.md#anonymizedphone)*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |

**Returns:** *[anonymizedPhone](_phonenumbers_.md#anonymizedphone)*

___

### `Const` getPhoneHash

▸ **getPhoneHash**(`sha3`: function, `phoneNumber`: string, `salt?`: undefined | string): *string*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L14)*

**Parameters:**

▪ **sha3**: *function*

▸ (`a`: string): *string | null*

**Parameters:**

Name | Type |
------ | ------ |
`a` | string |

▪ **phoneNumber**: *string*

▪`Optional`  **salt**: *undefined | string*

**Returns:** *string*

___

###  isE164Number

▸ **isE164Number**(`phoneNumber`: string): *[isE164Number](_phonenumbers_.md#ise164number)*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`phoneNumber` | string |

**Returns:** *[isE164Number](_phonenumbers_.md#ise164number)*

## Object literals

### `Const` PhoneNumberBase

### ▪ **PhoneNumberBase**: *object*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L35)*

###  getPhoneHash

• **getPhoneHash**: *getPhoneHash*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L36)*

###  isE164Number

• **isE164Number**: *[isE164Number](_phonenumbers_.md#ise164number)*

*Defined in [packages/sdk/base/src/phoneNumbers.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L37)*
