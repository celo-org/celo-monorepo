# Interface: AbiCoder

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

###  decodeLog

▸ **decodeLog**(`inputs`: AbiInput[], `hexString`: string, `topics`: string[]): *EventLog*

*Defined in [packages/sdk/connect/src/abi-types.ts:22](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`inputs` | AbiInput[] |
`hexString` | string |
`topics` | string[] |

**Returns:** *EventLog*

___

###  decodeParameter

▸ **decodeParameter**(`type`: [ABIType](../modules/_abi_types_.md#abitype), `hex`: string): *any*

*Defined in [packages/sdk/connect/src/abi-types.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [ABIType](../modules/_abi_types_.md#abitype) |
`hex` | string |

**Returns:** *any*

___

###  decodeParameters

▸ **decodeParameters**(`types`: [ABIType](../modules/_abi_types_.md#abitype)[], `hex`: string): *[DecodedParamsArray](_abi_types_.decodedparamsarray.md)*

*Defined in [packages/sdk/connect/src/abi-types.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [ABIType](../modules/_abi_types_.md#abitype)[] |
`hex` | string |

**Returns:** *[DecodedParamsArray](_abi_types_.decodedparamsarray.md)*

▸ **decodeParameters**(`types`: AbiInput[], `hex`: string): *[DecodedParamsObject](_abi_types_.decodedparamsobject.md)*

*Defined in [packages/sdk/connect/src/abi-types.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | AbiInput[] |
`hex` | string |

**Returns:** *[DecodedParamsObject](_abi_types_.decodedparamsobject.md)*

___

###  encodeEventSignature

▸ **encodeEventSignature**(`name`: string | object): *string*

*Defined in [packages/sdk/connect/src/abi-types.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string &#124; object |

**Returns:** *string*

___

###  encodeFunctionCall

▸ **encodeFunctionCall**(`jsonInterface`: object, `parameters`: any[]): *string*

*Defined in [packages/sdk/connect/src/abi-types.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`jsonInterface` | object |
`parameters` | any[] |

**Returns:** *string*

___

###  encodeFunctionSignature

▸ **encodeFunctionSignature**(`name`: string | object): *string*

*Defined in [packages/sdk/connect/src/abi-types.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string &#124; object |

**Returns:** *string*

___

###  encodeParameter

▸ **encodeParameter**(`type`: [ABIType](../modules/_abi_types_.md#abitype), `parameter`: any): *string*

*Defined in [packages/sdk/connect/src/abi-types.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [ABIType](../modules/_abi_types_.md#abitype) |
`parameter` | any |

**Returns:** *string*

___

###  encodeParameters

▸ **encodeParameters**(`types`: [ABIType](../modules/_abi_types_.md#abitype)[], `paramaters`: any[]): *string*

*Defined in [packages/sdk/connect/src/abi-types.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L25)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [ABIType](../modules/_abi_types_.md#abitype)[] |
`paramaters` | any[] |

**Returns:** *string*
