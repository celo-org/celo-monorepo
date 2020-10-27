# External module: "utils/src/sign-typed-data-utils"

## Index

### Interfaces

* [EIP712Object](../interfaces/_utils_src_sign_typed_data_utils_.eip712object.md)
* [EIP712Parameter](../interfaces/_utils_src_sign_typed_data_utils_.eip712parameter.md)
* [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md)
* [EIP712Types](../interfaces/_utils_src_sign_typed_data_utils_.eip712types.md)

### Type aliases

* [EIP712ObjectValue](_utils_src_sign_typed_data_utils_.md#eip712objectvalue)

### Functions

* [generateTypedDataHash](_utils_src_sign_typed_data_utils_.md#generatetypeddatahash)
* [structHash](_utils_src_sign_typed_data_utils_.md#structhash)

## Type aliases

###  EIP712ObjectValue

Ƭ **EIP712ObjectValue**: *string | number | [EIP712Object](../interfaces/_utils_src_sign_typed_data_utils_.eip712object.md)*

*Defined in [packages/utils/src/sign-typed-data-utils.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/sign-typed-data-utils.ts#L14)*

## Functions

###  generateTypedDataHash

▸ **generateTypedDataHash**(`typedData`: [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md)): *Buffer*

*Defined in [packages/utils/src/sign-typed-data-utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/sign-typed-data-utils.ts#L32)*

Generates the EIP712 Typed Data hash for signing

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_utils_src_sign_typed_data_utils_.eip712typeddata.md) | An object that conforms to the EIP712TypedData interface |

**Returns:** *Buffer*

A Buffer containing the hash of the typed data.

___

###  structHash

▸ **structHash**(`primaryType`: string, `data`: [EIP712Object](../interfaces/_utils_src_sign_typed_data_utils_.eip712object.md), `types`: [EIP712Types](../interfaces/_utils_src_sign_typed_data_utils_.eip712types.md)): *Buffer*

*Defined in [packages/utils/src/sign-typed-data-utils.ts:107](https://github.com/celo-org/celo-monorepo/blob/master/packages/utils/src/sign-typed-data-utils.ts#L107)*

**Parameters:**

Name | Type |
------ | ------ |
`primaryType` | string |
`data` | [EIP712Object](../interfaces/_utils_src_sign_typed_data_utils_.eip712object.md) |
`types` | [EIP712Types](../interfaces/_utils_src_sign_typed_data_utils_.eip712types.md) |

**Returns:** *Buffer*
