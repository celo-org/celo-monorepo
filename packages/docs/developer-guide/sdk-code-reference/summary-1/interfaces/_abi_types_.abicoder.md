# AbiCoder

## Hierarchy

* **AbiCoder**

## Index

### Methods

* [decodeLog](_abi_types_.abicoder.md#decodelog)
* [decodeParameter](_abi_types_.abicoder.md#decodeparameter)
* [decodeParameters](_abi_types_.abicoder.md#decodeparameters)
* [encodeEventSignature](_abi_types_.abicoder.md#encodeeventsignature)
* [encodeFunctionCall](_abi_types_.abicoder.md#encodefunctioncall)
* [encodeFunctionSignature](_abi_types_.abicoder.md#encodefunctionsignature)
* [encodeParameter](_abi_types_.abicoder.md#encodeparameter)
* [encodeParameters](_abi_types_.abicoder.md#encodeparameters)

## Methods

### decodeLog

▸ **decodeLog**\(`inputs`: AbiInput\[\], `hexString`: string, `topics`: string\[\]\): _EventLog_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:22_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L22)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `inputs` | AbiInput\[\] |
| `hexString` | string |
| `topics` | string\[\] |

**Returns:** _EventLog_

### decodeParameter

▸ **decodeParameter**\(`type`: [ABIType](../modules/_abi_types_.md#abitype), `hex`: string\): _any_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | [ABIType](../modules/_abi_types_.md#abitype) |
| `hex` | string |

**Returns:** _any_

### decodeParameters

▸ **decodeParameters**\(`types`: [ABIType](../modules/_abi_types_.md#abitype)\[\], `hex`: string\): [_DecodedParamsArray_](_abi_types_.decodedparamsarray.md)

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L33)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `types` | [ABIType](../modules/_abi_types_.md#abitype)\[\] |
| `hex` | string |

**Returns:** [_DecodedParamsArray_](_abi_types_.decodedparamsarray.md)

▸ **decodeParameters**\(`types`: AbiInput\[\], `hex`: string\): [_DecodedParamsObject_](_abi_types_.decodedparamsobject.md)

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L34)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `types` | AbiInput\[\] |
| `hex` | string |

**Returns:** [_DecodedParamsObject_](_abi_types_.decodedparamsobject.md)

### encodeEventSignature

▸ **encodeEventSignature**\(`name`: string \| object\): _string_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string \| object |

**Returns:** _string_

### encodeFunctionCall

▸ **encodeFunctionCall**\(`jsonInterface`: object, `parameters`: any\[\]\): _string_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L28)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `jsonInterface` | object |
| `parameters` | any\[\] |

**Returns:** _string_

### encodeFunctionSignature

▸ **encodeFunctionSignature**\(`name`: string \| object\): _string_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:29_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L29)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `name` | string \| object |

**Returns:** _string_

### encodeParameter

▸ **encodeParameter**\(`type`: [ABIType](../modules/_abi_types_.md#abitype), `parameter`: any\): _string_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:24_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L24)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `type` | [ABIType](../modules/_abi_types_.md#abitype) |
| `parameter` | any |

**Returns:** _string_

### encodeParameters

▸ **encodeParameters**\(`types`: [ABIType](../modules/_abi_types_.md#abitype)\[\], `paramaters`: any\[\]\): _string_

_Defined in_ [_packages/sdk/connect/src/abi-types.ts:25_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L25)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `types` | [ABIType](../modules/_abi_types_.md#abitype)\[\] |
| `paramaters` | any\[\] |

**Returns:** _string_

