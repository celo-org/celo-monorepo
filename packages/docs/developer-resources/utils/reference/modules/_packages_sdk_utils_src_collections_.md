# Module: "packages/sdk/utils/src/collections"

## Index

### References

* [intersection](_packages_sdk_utils_src_collections_.md#intersection)
* [notEmpty](_packages_sdk_utils_src_collections_.md#notempty)
* [zeroRange](_packages_sdk_utils_src_collections_.md#zerorange)
* [zip](_packages_sdk_utils_src_collections_.md#zip)
* [zip3](_packages_sdk_utils_src_collections_.md#zip3)

### Type aliases

* [AddressListItem](_packages_sdk_utils_src_collections_.md#addresslistitem)

### Functions

* [linkedListChange](_packages_sdk_utils_src_collections_.md#linkedlistchange)
* [linkedListChanges](_packages_sdk_utils_src_collections_.md#linkedlistchanges)

## References

###  intersection

• **intersection**:

___

###  notEmpty

• **notEmpty**:

___

###  zeroRange

• **zeroRange**:

___

###  zip

• **zip**:

___

###  zip3

• **zip3**:

## Type aliases

###  AddressListItem

Ƭ **AddressListItem**: *AddressListItem‹BigNumber›*

*Defined in [packages/sdk/utils/src/collections.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L7)*

## Functions

###  linkedListChange

▸ **linkedListChange**(`sortedList`: AddressListItem[], `change`: AddressListItem): *object*

*Defined in [packages/sdk/utils/src/collections.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | AddressListItem[] |
`change` | AddressListItem |

**Returns:** *object*

* **greater**: *string*

* **lesser**: *string*

* **list**: *AddressListItem[]*

___

###  linkedListChanges

▸ **linkedListChanges**(`sortedList`: AddressListItem[], `changeList`: AddressListItem[]): *object*

*Defined in [packages/sdk/utils/src/collections.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | AddressListItem[] |
`changeList` | AddressListItem[] |

**Returns:** *object*

* **greaters**: *string[]*

* **lessers**: *string[]*

* **list**: *AddressListItem[]*
