# collections

## Index

### Interfaces

* [AddressListItem]()

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

### Comparator

Ƭ **Comparator**: _function_

_Defined in_ [_packages/sdk/base/src/collections.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L50)

#### Type declaration:

▸ \(`a`: T, `b`: T\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | T |
| `b` | T |

## Functions

### intersection

▸ **intersection**&lt;**T**&gt;\(`arrays`: T\[\]\[\]\): _T\[\]_

_Defined in_ [_packages/sdk/base/src/collections.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L32)

**Type parameters:**

▪ **T**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `arrays` | T\[\]\[\] |

**Returns:** _T\[\]_

### linkedListChange

▸ **linkedListChange**&lt;**T**&gt;\(`sortedList`: Array‹[AddressListItem]()‹T››, `change`: [AddressListItem]()‹T›, `comparator`: [Comparator](_collections_.md#comparator)‹T›\): _object_

_Defined in_ [_packages/sdk/base/src/collections.ts:90_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L90)

**Type parameters:**

▪ **T**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sortedList` | Array‹[AddressListItem]()‹T›› |
| `change` | [AddressListItem]()‹T› |
| `comparator` | [Comparator](_collections_.md#comparator)‹T› |

**Returns:** _object_

* **greater**: _string_
* **lesser**: _string_
* **list**: _Array‹_[_AddressListItem_]()_‹T››_

### linkedListChanges

▸ **linkedListChanges**&lt;**T**&gt;\(`sortedList`: Array‹[AddressListItem]()‹T››, `changeList`: Array‹[AddressListItem]()‹T››, `comparator`: [Comparator](_collections_.md#comparator)‹T›\): _object_

_Defined in_ [_packages/sdk/base/src/collections.ts:100_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L100)

**Type parameters:**

▪ **T**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `sortedList` | Array‹[AddressListItem]()‹T›› |
| `changeList` | Array‹[AddressListItem]()‹T›› |
| `comparator` | [Comparator](_collections_.md#comparator)‹T› |

**Returns:** _object_

* **greaters**: _string\[\]_
* **lessers**: _string\[\]_
* **list**: _Array‹_[_AddressListItem_]()_‹T››_

### notEmpty

▸ **notEmpty**&lt;**TValue**&gt;\(`value`: TValue \| null \| undefined\): _value is TValue_

_Defined in_ [_packages/sdk/base/src/collections.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L28)

**Type parameters:**

▪ **TValue**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `value` | TValue \| null \| undefined |

**Returns:** _value is TValue_

### zeroRange

▸ **zeroRange**\(`to`: number\): _number\[\]_

_Defined in_ [_packages/sdk/base/src/collections.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `to` | number |

**Returns:** _number\[\]_

### zip

▸ **zip**&lt;**A**, **B**, **C**&gt;\(`fn`: function, `as`: A\[\], `bs`: B\[\]\): _C\[\]_

_Defined in_ [_packages/sdk/base/src/collections.ts:3_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L3)

**Type parameters:**

▪ **A**

▪ **B**

▪ **C**

**Parameters:**

▪ **fn**: _function_

▸ \(`a`: A, `b`: B\): _C_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `a` | A |
| `b` | B |

▪ **as**: _A\[\]_

▪ **bs**: _B\[\]_

**Returns:** _C\[\]_

### zip3

▸ **zip3**&lt;**A**, **B**, **C**&gt;\(`as`: A\[\], `bs`: B\[\], `cs`: C\[\]\): _\[A, B, C\]\[\]_

_Defined in_ [_packages/sdk/base/src/collections.ts:13_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/collections.ts#L13)

**Type parameters:**

▪ **A**

▪ **B**

▪ **C**

**Parameters:**

| Name | Type |
| :--- | :--- |
| `as` | A\[\] |
| `bs` | B\[\] |
| `cs` | C\[\] |

**Returns:** _\[A, B, C\]\[\]_

