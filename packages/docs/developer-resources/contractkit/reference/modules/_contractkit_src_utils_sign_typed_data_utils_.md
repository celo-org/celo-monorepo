# External module: "contractkit/src/utils/sign-typed-data-utils"

## Index

### Interfaces

* [EIP712Object](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712object.md)
* [EIP712Parameter](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712parameter.md)
* [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md)
* [EIP712Types](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712types.md)

### Type aliases

* [EIP712ObjectValue](_contractkit_src_utils_sign_typed_data_utils_.md#eip712objectvalue)

### Functions

* [generateTypedDataHash](_contractkit_src_utils_sign_typed_data_utils_.md#generatetypeddatahash)

## Type aliases

###  EIP712ObjectValue

Ƭ **EIP712ObjectValue**: *string | number | [EIP712Object](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712object.md)*

*Defined in [contractkit/src/utils/sign-typed-data-utils.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/sign-typed-data-utils.ts#L14)*

## Functions

###  generateTypedDataHash

▸ **generateTypedDataHash**(`typedData`: [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md)): *Buffer*

*Defined in [contractkit/src/utils/sign-typed-data-utils.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/sign-typed-data-utils.ts#L32)*

Generates the EIP712 Typed Data hash for signing

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`typedData` | [EIP712TypedData](../interfaces/_contractkit_src_utils_sign_typed_data_utils_.eip712typeddata.md) | An object that conforms to the EIP712TypedData interface |

**Returns:** *Buffer*

A Buffer containing the hash of the typed data.
