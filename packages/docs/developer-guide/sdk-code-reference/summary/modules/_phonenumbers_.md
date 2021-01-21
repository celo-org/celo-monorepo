# phoneNumbers

## Index

### Interfaces

* [ParsedPhoneNumber]()

### Functions

* [anonymizedPhone](_phonenumbers_.md#anonymizedphone)
* [getPhoneHash](_phonenumbers_.md#const-getphonehash)
* [isE164Number](_phonenumbers_.md#ise164number)

### Object literals

* [PhoneNumberBase](_phonenumbers_.md#const-phonenumberbase)

## Functions

### anonymizedPhone

▸ **anonymizedPhone**\(`phoneNumber`: string\): _string_

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |

**Returns:** _string_

### `Const` getPhoneHash

▸ **getPhoneHash**\(`sha3`: function, `phoneNumber`: string, `salt?`: undefined \| string\): _string_

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L14)

**Parameters:**

▪ **sha3**: _function_

▸ \(`a`: string\): _string \| null_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | string |

▪ **phoneNumber**: _string_

▪`Optional` **salt**: _undefined \| string_

**Returns:** _string_

### isE164Number

▸ **isE164Number**\(`phoneNumber`: string\): _boolean_

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `phoneNumber` | string |

**Returns:** _boolean_

## Object literals

### `Const` PhoneNumberBase

### ▪ **PhoneNumberBase**: _object_

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:35_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L35)

### getPhoneHash

• **getPhoneHash**: _getPhoneHash_

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:36_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L36)

### isE164Number

• **isE164Number**: [_isE164Number_](_phonenumbers_.md#ise164number)

_Defined in_ [_packages/sdk/base/src/phoneNumbers.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/phoneNumbers.ts#L37)

