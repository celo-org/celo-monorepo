[@celo/connect](../README.md) › [Globals](../globals.md) › ["abi-types"](../modules/_abi_types_.md) › [AbiCoder](_abi_types_.abicoder.md)

# Interface: AbiCoder

**`internal`** 

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

▸ **decodeLog**(`inputs`: [AbiInput](_abi_types_.abiinput.md)[], `hexString`: string, `topics`: string[]): *EventLog*

*Defined in [abi-types.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`inputs` | [AbiInput](_abi_types_.abiinput.md)[] |
`hexString` | string |
`topics` | string[] |

**Returns:** *EventLog*

___

###  decodeParameter

▸ **decodeParameter**(`type`: [ABIType](../modules/_abi_types_.md#abitype), `hex`: string): *any*

*Defined in [abi-types.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [ABIType](../modules/_abi_types_.md#abitype) |
`hex` | string |

**Returns:** *any*

___

###  decodeParameters

▸ **decodeParameters**(`types`: [ABIType](../modules/_abi_types_.md#abitype)[], `hex`: string): *[DecodedParamsArray](_abi_types_.decodedparamsarray.md)*

*Defined in [abi-types.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [ABIType](../modules/_abi_types_.md#abitype)[] |
`hex` | string |

**Returns:** *[DecodedParamsArray](_abi_types_.decodedparamsarray.md)*

▸ **decodeParameters**(`types`: [AbiInput](_abi_types_.abiinput.md)[], `hex`: string): *[DecodedParamsObject](_abi_types_.decodedparamsobject.md)*

*Defined in [abi-types.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L67)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [AbiInput](_abi_types_.abiinput.md)[] |
`hex` | string |

**Returns:** *[DecodedParamsObject](_abi_types_.decodedparamsobject.md)*

___

###  encodeEventSignature

▸ **encodeEventSignature**(`name`: string | object): *string*

*Defined in [abi-types.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string &#124; object |

**Returns:** *string*

___

###  encodeFunctionCall

▸ **encodeFunctionCall**(`jsonInterface`: object, `parameters`: any[]): *string*

*Defined in [abi-types.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L61)*

**Parameters:**

Name | Type |
------ | ------ |
`jsonInterface` | object |
`parameters` | any[] |

**Returns:** *string*

___

###  encodeFunctionSignature

▸ **encodeFunctionSignature**(`name`: string | object): *string*

*Defined in [abi-types.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`name` | string &#124; object |

**Returns:** *string*

___

###  encodeParameter

▸ **encodeParameter**(`type`: [ABIType](../modules/_abi_types_.md#abitype), `parameter`: any): *string*

*Defined in [abi-types.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [ABIType](../modules/_abi_types_.md#abitype) |
`parameter` | any |

**Returns:** *string*

___

###  encodeParameters

▸ **encodeParameters**(`types`: [ABIType](../modules/_abi_types_.md#abitype)[], `paramaters`: any[]): *string*

*Defined in [abi-types.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/connect/src/abi-types.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`types` | [ABIType](../modules/_abi_types_.md#abitype)[] |
`paramaters` | any[] |

**Returns:** *string*
