# packages/sdk/utils/src/sign-typed-data-utils

## Index

### Interfaces

* [EIP712Object]()
* [EIP712Parameter]()
* [EIP712TypedData]()
* [EIP712Types]()

### Type aliases

* [EIP712ObjectValue](_packages_sdk_utils_src_sign_typed_data_utils_.md#eip712objectvalue)

### Functions

* [generateTypedDataHash](_packages_sdk_utils_src_sign_typed_data_utils_.md#generatetypeddatahash)
* [structHash](_packages_sdk_utils_src_sign_typed_data_utils_.md#structhash)

## Type aliases

### EIP712ObjectValue

Ƭ **EIP712ObjectValue**: _string \| number \|_ [_EIP712Object_]()

_Defined in_ [_packages/sdk/utils/src/sign-typed-data-utils.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L14)

## Functions

### generateTypedDataHash

▸ **generateTypedDataHash**\(`typedData`: [EIP712TypedData]()\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/sign-typed-data-utils.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L32)

Generates the EIP712 Typed Data hash for signing

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `typedData` | [EIP712TypedData]() | An object that conforms to the EIP712TypedData interface |

**Returns:** _Buffer_

A Buffer containing the hash of the typed data.

### structHash

▸ **structHash**\(`primaryType`: string, `data`: [EIP712Object](), `types`: [EIP712Types]()\): _Buffer_

_Defined in_ [_packages/sdk/utils/src/sign-typed-data-utils.ts:107_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/sign-typed-data-utils.ts#L107)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `primaryType` | string |
| `data` | [EIP712Object]() |
| `types` | [EIP712Types]() |

**Returns:** _Buffer_

