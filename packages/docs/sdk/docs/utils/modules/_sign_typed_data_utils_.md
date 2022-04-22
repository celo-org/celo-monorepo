[@celo/utils](../README.md) › ["sign-typed-data-utils"](_sign_typed_data_utils_.md)

# Module: "sign-typed-data-utils"

## Index

### Interfaces

* [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md)
* [EIP712Parameter](../interfaces/_sign_typed_data_utils_.eip712parameter.md)
* [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)
* [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)
* [EIP712TypesWithPrimary](../interfaces/_sign_typed_data_utils_.eip712typeswithprimary.md)

### Type aliases

* [EIP712ObjectValue](_sign_typed_data_utils_.md#eip712objectvalue)
* [EIP712Optional](_sign_typed_data_utils_.md#eip712optional)

### Variables

* [EIP712_ATOMIC_TYPES](_sign_typed_data_utils_.md#const-eip712_atomic_types)
* [EIP712_BUILTIN_TYPES](_sign_typed_data_utils_.md#const-eip712_builtin_types)
* [EIP712_DYNAMIC_TYPES](_sign_typed_data_utils_.md#const-eip712_dynamic_types)

### Functions

* [defined](_sign_typed_data_utils_.md#const-defined)
* [eip712OptionalSchema](_sign_typed_data_utils_.md#const-eip712optionalschema)
* [eip712OptionalType](_sign_typed_data_utils_.md#const-eip712optionaltype)
* [encodeData](_sign_typed_data_utils_.md#encodedata)
* [encodeType](_sign_typed_data_utils_.md#encodetype)
* [generateTypedDataHash](_sign_typed_data_utils_.md#generatetypeddatahash)
* [structHash](_sign_typed_data_utils_.md#structhash)
* [typeHash](_sign_typed_data_utils_.md#typehash)
* [zeroValue](_sign_typed_data_utils_.md#zerovalue)

### Object literals

* [noBool](_sign_typed_data_utils_.md#const-nobool)
* [noNumber](_sign_typed_data_utils_.md#const-nonumber)
* [noString](_sign_typed_data_utils_.md#const-nostring)

## Type aliases

###  EIP712ObjectValue

Ƭ **EIP712ObjectValue**: *string | number | BigNumber | boolean | Buffer | [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md) | [EIP712ObjectValue](_sign_typed_data_utils_.md#eip712objectvalue)[]*

*Defined in [sign-typed-data-utils.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L21)*

___

###  EIP712Optional

Ƭ **EIP712Optional**: *object*

*Defined in [sign-typed-data-utils.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L70)*

Utility type representing an optional value in a EIP-712 compatible manner, as long as the
concrete type T is a subtype of EIP712ObjectValue.

**`remarks`** EIP712Optonal is not part of the EIP712 standard, but is fully compatible with it.

#### Type declaration:

* **defined**: *boolean*

* **value**: *T*

## Variables

### `Const` EIP712_ATOMIC_TYPES

• **EIP712_ATOMIC_TYPES**: *string[]* = [
  'bytes1',
  'bytes32',
  'uint8',
  'uint256',
  'int8',
  'int256',
  'bool',
  'address',
]

*Defined in [sign-typed-data-utils.ts:42](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L42)*

Array of all EIP-712 atomic type names.

___

### `Const` EIP712_BUILTIN_TYPES

• **EIP712_BUILTIN_TYPES**: *string[]* = EIP712_ATOMIC_TYPES.concat(EIP712_DYNAMIC_TYPES)

*Defined in [sign-typed-data-utils.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L55)*

___

### `Const` EIP712_DYNAMIC_TYPES

• **EIP712_DYNAMIC_TYPES**: *string[]* = ['bytes', 'string']

*Defined in [sign-typed-data-utils.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L53)*

## Functions

### `Const` defined

▸ **defined**<**T**>(`value`: T): *[EIP712Optional](_sign_typed_data_utils_.md#eip712optional)‹T›*

*Defined in [sign-typed-data-utils.ts:98](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L98)*

Utility to construct an defined EIP712Optional value with inferred type.

**Type parameters:**

▪ **T**: *[EIP712ObjectValue](_sign_typed_data_utils_.md#eip712objectvalue)*

**Parameters:**

Name | Type |
------ | ------ |
`value` | T |

**Returns:** *[EIP712Optional](_sign_typed_data_utils_.md#eip712optional)‹T›*

___

### `Const` eip712OptionalSchema

▸ **eip712OptionalSchema**<**S**>(`schema`: S): *TypeC‹object›*

*Defined in [sign-typed-data-utils.ts:91](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L91)*

Utility to build EIP712Optional<T> schemas for encoding and decoding with io-ts.

**Type parameters:**

▪ **S**: *Mixed*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`schema` | S | io-ts type (a.k.a. schema or codec) describing the inner type.  |

**Returns:** *TypeC‹object›*

___

### `Const` eip712OptionalType

▸ **eip712OptionalType**(`typeName`: string): *[EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)*

*Defined in [sign-typed-data-utils.ts:80](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L80)*

Utility to build EIP712Optional<T> types to insert in EIP-712 type arrays.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typeName` | string | EIP-712 string type name. Should be builtin or defined in the EIP712Types structure into which this type will be merged.  |

**Returns:** *[EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)*

___

###  encodeData

▸ **encodeData**(`primaryType`: string, `data`: [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md), `types`: [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)): *Buffer*

*Defined in [sign-typed-data-utils.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L239)*

Constructs the struct encoding of the data as the primary type.

**Parameters:**

Name | Type |
------ | ------ |
`primaryType` | string |
`data` | [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md) |
`types` | [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md) |

**Returns:** *Buffer*

___

###  encodeType

▸ **encodeType**(`primaryType`: string, `types`: [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)): *string*

*Defined in [sign-typed-data-utils.ts:172](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L172)*

Creates a string encoding of the primary type, including all dependencies.
E.g. "Transaction(Person from,Person to,Asset tx)Asset(address token,uint256 amount)Person(address wallet,string name)"

**Parameters:**

Name | Type |
------ | ------ |
`primaryType` | string |
`types` | [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md) |

**Returns:** *string*

___

###  generateTypedDataHash

▸ **generateTypedDataHash**(`typedData`: [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md)): *Buffer*

*Defined in [sign-typed-data-utils.ts:126](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L126)*

Generates the EIP712 Typed Data hash for signing

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_sign_typed_data_utils_.eip712typeddata.md) | An object that conforms to the EIP712TypedData interface |

**Returns:** *Buffer*

A Buffer containing the hash of the typed data.

___

###  structHash

▸ **structHash**(`primaryType`: string, `data`: [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md), `types`: [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)): *Buffer*

*Defined in [sign-typed-data-utils.ts:248](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L248)*

**Parameters:**

Name | Type |
------ | ------ |
`primaryType` | string |
`data` | [EIP712Object](../interfaces/_sign_typed_data_utils_.eip712object.md) |
`types` | [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md) |

**Returns:** *Buffer*

___

###  typeHash

▸ **typeHash**(`primaryType`: string, `types`: [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)): *Buffer*

*Defined in [sign-typed-data-utils.ts:183](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L183)*

**Parameters:**

Name | Type |
------ | ------ |
`primaryType` | string |
`types` | [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md) |

**Returns:** *Buffer*

___

###  zeroValue

▸ **zeroValue**(`primaryType`: string, `types`: [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md)): *[EIP712ObjectValue](_sign_typed_data_utils_.md#eip712objectvalue)*

*Defined in [sign-typed-data-utils.ts:264](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L264)*

Produce the zero value for a given type.

**`remarks`** 
All atomic types will encode as the 32-byte zero value. Dynamic types as an empty hash.
Dynamic arrays will return an empty array. Fixed length arrays will have members set to zero.
Structs will have the values of all fields set to zero recursively.

Note that EIP-712 does not specify zero values, and so this is non-standard.

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`primaryType` | string | - |
`types` | [EIP712Types](../interfaces/_sign_typed_data_utils_.eip712types.md) | {} |

**Returns:** *[EIP712ObjectValue](_sign_typed_data_utils_.md#eip712objectvalue)*

## Object literals

### `Const` noBool

### ▪ **noBool**: *object*

*Defined in [sign-typed-data-utils.ts:104](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L104)*

Undefined EIP712Optional type with value type boolean.

###  defined

• **defined**: *false* = false

*Defined in [sign-typed-data-utils.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L105)*

###  value

• **value**: *false* = false

*Defined in [sign-typed-data-utils.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L106)*

___

### `Const` noNumber

### ▪ **noNumber**: *object*

*Defined in [sign-typed-data-utils.ts:110](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L110)*

Undefined EIP712Optional type with value type number.

###  defined

• **defined**: *false* = false

*Defined in [sign-typed-data-utils.ts:111](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L111)*

###  value

• **value**: *number* = 0

*Defined in [sign-typed-data-utils.ts:112](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L112)*

___

### `Const` noString

### ▪ **noString**: *object*

*Defined in [sign-typed-data-utils.ts:116](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L116)*

Undefined EIP712Optional type with value type string.

###  defined

• **defined**: *false* = false

*Defined in [sign-typed-data-utils.ts:117](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L117)*

###  value

• **value**: *string* = ""

*Defined in [sign-typed-data-utils.ts:118](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L118)*
