[@celo/utils](../README.md) › ["collections"](_collections_.md)

# Module: "collections"

## Index

### References

* [intersection](_collections_.md#intersection)
* [notEmpty](_collections_.md#notempty)
* [zeroRange](_collections_.md#zerorange)
* [zip](_collections_.md#zip)
* [zip3](_collections_.md#zip3)

### Type aliases

* [AddressListItem](_collections_.md#addresslistitem)

### Functions

* [linkedListChange](_collections_.md#linkedlistchange)
* [linkedListChanges](_collections_.md#linkedlistchanges)

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

*Defined in [collections.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L7)*

## Functions

###  linkedListChange

▸ **linkedListChange**(`sortedList`: AddressListItem[], `change`: AddressListItem): *object*

*Defined in [collections.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L12)*

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

*Defined in [collections.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/collections.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | AddressListItem[] |
`changeList` | AddressListItem[] |

**Returns:** *object*

* **greaters**: *string[]*

* **lessers**: *string[]*

* **list**: *AddressListItem[]*
