[@celo/utils](../README.md) › ["fixidity"](_fixidity_.md)

# Module: "fixidity"

## Index

### Variables

* [digits](_fixidity_.md#const-digits)
* [fixed1](_fixidity_.md#const-fixed1)

### Functions

* [divide](_fixidity_.md#const-divide)
* [fixedToInt](_fixidity_.md#const-fixedtoint)
* [fromFixed](_fixidity_.md#const-fromfixed)
* [multiply](_fixidity_.md#const-multiply)
* [reciprocal](_fixidity_.md#const-reciprocal)
* [toFixed](_fixidity_.md#const-tofixed)

## Variables

### `Const` digits

• **digits**: *BigNumber‹›* = new BigNumber('24')

*Defined in [fixidity.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L3)*

___

### `Const` fixed1

• **fixed1**: *BigNumber‹›* = new BigNumber('1000000000000000000000000')

*Defined in [fixidity.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L4)*

## Functions

### `Const` divide

▸ **divide**(`a`: BigNumber, `b`: BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:24](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L24)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | BigNumber |
`b` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` fixedToInt

▸ **fixedToInt**(`f`: BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`f` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` fromFixed

▸ **fromFixed**(`f`: BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`f` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` multiply

▸ **multiply**(`a`: BigNumber, `b`: BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | BigNumber |
`b` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` reciprocal

▸ **reciprocal**(`f`: BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`f` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` toFixed

▸ **toFixed**(`n`: number | BigNumber): *BigNumber‹›*

*Defined in [fixidity.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`n` | number &#124; BigNumber |

**Returns:** *BigNumber‹›*
