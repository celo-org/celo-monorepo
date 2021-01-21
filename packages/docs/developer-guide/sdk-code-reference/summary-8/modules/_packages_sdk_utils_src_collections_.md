# packages/sdk/utils/src/collections

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

### intersection

• **intersection**:

### notEmpty

• **notEmpty**:

### zeroRange

• **zeroRange**:

### zip

• **zip**:

### zip3

• **zip3**:

## Type aliases

### AddressListItem

Ƭ **AddressListItem**: _AddressListItem‹BigNumber›_

_Defined in_ [_packages/sdk/utils/src/collections.ts:7_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L7)

## Functions

### linkedListChange

▸ **linkedListChange**\(`sortedList`: AddressListItem\[\], `change`: AddressListItem\): _object_

_Defined in_ [_packages/sdk/utils/src/collections.ts:12_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L12)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sortedList` | AddressListItem\[\] |
| `change` | AddressListItem |

**Returns:** _object_

* **greater**: _string_
* **lesser**: _string_
* **list**: _AddressListItem\[\]_

### linkedListChanges

▸ **linkedListChanges**\(`sortedList`: AddressListItem\[\], `changeList`: AddressListItem\[\]\): _object_

_Defined in_ [_packages/sdk/utils/src/collections.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sortedList` | AddressListItem\[\] |
| `changeList` | AddressListItem\[\] |

**Returns:** _object_

* **greaters**: _string\[\]_
* **lessers**: _string\[\]_
* **list**: _AddressListItem\[\]_

