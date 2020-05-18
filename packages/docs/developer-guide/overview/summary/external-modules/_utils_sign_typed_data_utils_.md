# utils/sign-typed-data-utils

## Index

### Interfaces

* [EIP712Object]()
* [EIP712Parameter]()
* [EIP712TypedData]()
* [EIP712Types]()

### Type aliases

* [EIP712ObjectValue](_utils_sign_typed_data_utils_.md#eip712objectvalue)

### Functions

* [generateTypedDataHash](_utils_sign_typed_data_utils_.md#generatetypeddatahash)

## Type aliases

### EIP712ObjectValue

Ƭ **EIP712ObjectValue**: _string \| number \|_ [_EIP712Object_]()

_Defined in_ [_contractkit/src/utils/sign-typed-data-utils.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/sign-typed-data-utils.ts#L14)

## Functions

### generateTypedDataHash

▸ **generateTypedDataHash**\(`typedData`: [EIP712TypedData]()\): _Buffer_

_Defined in_ [_contractkit/src/utils/sign-typed-data-utils.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/utils/sign-typed-data-utils.ts#L32)

Generates the EIP712 Typed Data hash for signing

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `typedData` | [EIP712TypedData]() | An object that conforms to the EIP712TypedData interface |

**Returns:** _Buffer_

A Buffer containing the hash of the typed data.

