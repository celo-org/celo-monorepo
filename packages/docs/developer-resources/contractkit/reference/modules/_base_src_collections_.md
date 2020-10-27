# External module: "base/src/collections"

## Index

### Interfaces

* [AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)

### Type aliases

* [Comparator](_base_src_collections_.md#comparator)

### Functions

* [intersection](_base_src_collections_.md#intersection)
* [linkedListChange](_base_src_collections_.md#linkedlistchange)
* [linkedListChanges](_base_src_collections_.md#linkedlistchanges)
* [notEmpty](_base_src_collections_.md#notempty)
* [zip](_base_src_collections_.md#zip)
* [zip3](_base_src_collections_.md#zip3)

## Type aliases

###  Comparator

Ƭ **Comparator**: *function*

*Defined in [packages/base/src/collections.ts:46](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L46)*

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

*Defined in [packages/base/src/collections.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L28)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`arrays` | T[][] |

**Returns:** *T[]*

___

###  linkedListChange

▸ **linkedListChange**<**T**>(`sortedList`: Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T››, `change`: [AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T›, `comparator`: [Comparator](_base_src_collections_.md#comparator)‹T›): *object*

*Defined in [packages/base/src/collections.ts:86](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L86)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T›› |
`change` | [AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T› |
`comparator` | [Comparator](_base_src_collections_.md#comparator)‹T› |

**Returns:** *object*

* **greater**: *string*

* **lesser**: *string*

* **list**: *Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T››*

___

###  linkedListChanges

▸ **linkedListChanges**<**T**>(`sortedList`: Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T››, `changeList`: Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T››, `comparator`: [Comparator](_base_src_collections_.md#comparator)‹T›): *object*

*Defined in [packages/base/src/collections.ts:96](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L96)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`sortedList` | Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T›› |
`changeList` | Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T›› |
`comparator` | [Comparator](_base_src_collections_.md#comparator)‹T› |

**Returns:** *object*

* **greaters**: *string[]*

* **lessers**: *string[]*

* **list**: *Array‹[AddressListItem](../interfaces/_base_src_collections_.addresslistitem.md)‹T››*

___

###  notEmpty

▸ **notEmpty**<**TValue**>(`value`: TValue | null | undefined): *value is TValue*

*Defined in [packages/base/src/collections.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L24)*

**Type parameters:**

▪ **TValue**

**Parameters:**

Name | Type |
------ | ------ |
`value` | TValue &#124; null &#124; undefined |

**Returns:** *value is TValue*

___

###  zip

▸ **zip**<**A**, **B**, **C**>(`fn`: function, `as`: A[], `bs`: B[]): *C[]*

*Defined in [packages/base/src/collections.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L3)*

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

*Defined in [packages/base/src/collections.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/collections.ts#L13)*

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
