# External module: "base/src/contacts"

## Index

### Interfaces

* [ContactPhoneNumber](../interfaces/_base_src_contacts_.contactphonenumber.md)
* [MinimalContact](../interfaces/_base_src_contacts_.minimalcontact.md)

### Functions

* [getContactPhoneNumber](_base_src_contacts_.md#const-getcontactphonenumber)
* [isContact](_base_src_contacts_.md#iscontact)

## Functions

### `Const` getContactPhoneNumber

▸ **getContactPhoneNumber**(`contact`: [MinimalContact](../interfaces/_base_src_contacts_.minimalcontact.md)): *undefined | null | string*

*Defined in [packages/base/src/contacts.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/contacts.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`contact` | [MinimalContact](../interfaces/_base_src_contacts_.minimalcontact.md) |

**Returns:** *undefined | null | string*

___

###  isContact

▸ **isContact**(`contactOrNumber`: any): *contactOrNumber is MinimalContact*

*Defined in [packages/base/src/contacts.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/contacts.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`contactOrNumber` | any |

**Returns:** *contactOrNumber is MinimalContact*
