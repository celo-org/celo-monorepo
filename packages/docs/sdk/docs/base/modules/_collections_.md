[@celo/base](../README.md) › ["collections"](_collections_.md)

# Module: "collections"

## Index

### Interfaces

* [AddressListItem](../interfaces/_collections_.addresslistitem.md)

### Type aliases

* [Comparator](_collections_.md#comparator)

### Functions

* [intersection](_collections_.md#intersection)
* [linkedListChange](_collections_.md#linkedlistchange)
* [linkedListChanges](_collections_.md#linkedlistchanges)
* [notEmpty](_collections_.md#notempty)
* [zeroRange](_collections_.md#zerorange)
* [zip](_collections_.md#zip)
* [zip3](_collections_.md#zip3)

## Type aliases

###  Comparator

Ƭ **Comparator**: *function*

*Defined in [packages/sdk/base/src/collections.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L50)*

#### Type declaration:

▸ (`a`: T, `b`: T): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`a` | T |
`b` | T |

## Functions

###  intersection

▸ **intersection**<**T**>(`arrays`: T[][]): *T[]*

*Defined in [packages/sdk/base/src/collections.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L32)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arrays` | T[][] |

**Returns:** *T[]*

___

###  linkedListChange

▸ **linkedListChange**<**T**>(`sortedList`: Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T››, `change`: [AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T›, `comparator`: [Comparator](_collections_.md#comparator)‹T›): *object*

*Defined in [packages/sdk/base/src/collections.ts:90](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L90)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T›› |
`change` | [AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T› |
`comparator` | [Comparator](_collections_.md#comparator)‹T› |

**Returns:** *object*

* **greater**: *string*

* **lesser**: *string*

* **list**: *Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T››*

___

###  linkedListChanges

▸ **linkedListChanges**<**T**>(`sortedList`: Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T››, `changeList`: Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T››, `comparator`: [Comparator](_collections_.md#comparator)‹T›): *object*

*Defined in [packages/sdk/base/src/collections.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L100)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T›› |
`changeList` | Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T›› |
`comparator` | [Comparator](_collections_.md#comparator)‹T› |

**Returns:** *object*

* **greaters**: *string[]*

* **lessers**: *string[]*

* **list**: *Array‹[AddressListItem](../interfaces/_collections_.addresslistitem.md)‹T››*

___

###  notEmpty

▸ **notEmpty**<**TValue**>(`value`: TValue | null | undefined): *value is TValue*

*Defined in [packages/sdk/base/src/collections.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L28)*

**Type parameters:**

▪ **TValue**

**Parameters:**

Name | Type |
------ | ------ |
`value` | TValue &#124; null &#124; undefined |

**Returns:** *value is TValue*

___

###  zeroRange

▸ **zeroRange**(`to`: number): *number[]*

*Defined in [packages/sdk/base/src/collections.ts:23](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`to` | number |

**Returns:** *number[]*

___

###  zip

▸ **zip**<**A**, **B**, **C**>(`fn`: function, `as`: A[], `bs`: B[]): *C[]*

*Defined in [packages/sdk/base/src/collections.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L3)*

**Type parameters:**

▪ **A**

▪ **B**

▪ **C**

**Parameters:**

▪ **fn**: *function*

▸ (`a`: A, `b`: B): *C*

**Parameters:**

Name | Type |
------ | ------ |
`a` | A |
`b` | B |

▪ **as**: *A[]*

▪ **bs**: *B[]*

**Returns:** *C[]*

___

###  zip3

▸ **zip3**<**A**, **B**, **C**>(`as`: A[], `bs`: B[], `cs`: C[]): *[A, B, C][]*

*Defined in [packages/sdk/base/src/collections.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L13)*

**Type parameters:**

▪ **A**

▪ **B**

▪ **C**

**Parameters:**

Name | Type |
------ | ------ |
`as` | A[] |
`bs` | B[] |
`cs` | C[] |

**Returns:** *[A, B, C][]*
