# Module: "packages/sdk/utils/src/fixidity"

## Index

### Variables

* [digits](_packages_sdk_utils_src_fixidity_.md#const-digits)
* [fixed1](_packages_sdk_utils_src_fixidity_.md#const-fixed1)

### Functions

* [fixedToInt](_packages_sdk_utils_src_fixidity_.md#const-fixedtoint)
* [fromFixed](_packages_sdk_utils_src_fixidity_.md#const-fromfixed)
* [multiply](_packages_sdk_utils_src_fixidity_.md#const-multiply)
* [toFixed](_packages_sdk_utils_src_fixidity_.md#const-tofixed)

## Variables

### `Const` digits

• **digits**: *BigNumber‹›* = new BigNumber('24')

*Defined in [packages/sdk/utils/src/fixidity.ts:3](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L3)*

___

### `Const` fixed1

• **fixed1**: *BigNumber‹›* = new BigNumber('1000000000000000000000000')

*Defined in [packages/sdk/utils/src/fixidity.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L4)*

## Functions

### `Const` fixedToInt

▸ **fixedToInt**(`f`: BigNumber): *BigNumber‹›*

*Defined in [packages/sdk/utils/src/fixidity.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`f` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` fromFixed

▸ **fromFixed**(`f`: BigNumber): *BigNumber‹›*

*Defined in [packages/sdk/utils/src/fixidity.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`f` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` multiply

▸ **multiply**(`a`: BigNumber, `b`: BigNumber): *BigNumber‹›*

*Defined in [packages/sdk/utils/src/fixidity.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L20)*

**Parameters:**

Name | Type |
------ | ------ |
`a` | BigNumber |
`b` | BigNumber |

**Returns:** *BigNumber‹›*

___

### `Const` toFixed

▸ **toFixed**(`n`: number | BigNumber): *BigNumber‹›*

*Defined in [packages/sdk/utils/src/fixidity.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/fixidity.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`n` | number &#124; BigNumber |

**Returns:** *BigNumber‹›*
