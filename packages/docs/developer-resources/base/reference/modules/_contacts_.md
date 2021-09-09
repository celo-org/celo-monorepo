# Module: "contacts"

## Index

### Interfaces

* [ContactPhoneNumber](../interfaces/_contacts_.contactphonenumber.md)
* [MinimalContact](../interfaces/_contacts_.minimalcontact.md)

### Functions

* [getContactPhoneNumber](_contacts_.md#const-getcontactphonenumber)
* [isContact](_contacts_.md#iscontact)

## Functions

### `Const` getContactPhoneNumber

▸ **getContactPhoneNumber**(`contact`: [MinimalContact](../interfaces/_contacts_.minimalcontact.md)): *undefined | null | string*

*Defined in [packages/sdk/base/src/contacts.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/contacts.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`contact` | [MinimalContact](../interfaces/_contacts_.minimalcontact.md) |

**Returns:** *undefined | null | string*

___

###  isContact

▸ **isContact**(`contactOrNumber`: any): *contactOrNumber is MinimalContact*

*Defined in [packages/sdk/base/src/contacts.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/contacts.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`contactOrNumber` | any |

**Returns:** *contactOrNumber is MinimalContact*
