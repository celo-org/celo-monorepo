[@celo/utils](../README.md) › ["istanbul"](_istanbul_.md)

# Module: "istanbul"

## Index

### Interfaces

* [IstanbulExtra](../interfaces/_istanbul_.istanbulextra.md)
* [Seal](../interfaces/_istanbul_.seal.md)

### Type aliases

* [Bitmap](_istanbul_.md#bitmap)

### Functions

* [bitIsSet](_istanbul_.md#bitisset)
* [parseBlockExtraData](_istanbul_.md#parseblockextradata)

### Object literals

* [IstanbulUtils](_istanbul_.md#const-istanbulutils)

## Type aliases

###  Bitmap

Ƭ **Bitmap**: *BigNumber*

*Defined in [istanbul.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L11)*

## Functions

###  bitIsSet

▸ **bitIsSet**(`bitmap`: [Bitmap](_istanbul_.md#bitmap), `index`: number): *boolean*

*Defined in [istanbul.ts:56](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`bitmap` | [Bitmap](_istanbul_.md#bitmap) |
`index` | number |

**Returns:** *boolean*

___

###  parseBlockExtraData

▸ **parseBlockExtraData**(`data`: string): *[IstanbulExtra](../interfaces/_istanbul_.istanbulextra.md)*

*Defined in [istanbul.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L43)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *[IstanbulExtra](../interfaces/_istanbul_.istanbulextra.md)*

## Object literals

### `Const` IstanbulUtils

### ▪ **IstanbulUtils**: *object*

*Defined in [istanbul.ts:66](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L66)*

###  bitIsSet

• **bitIsSet**: *[bitIsSet](_istanbul_.md#bitisset)*

*Defined in [istanbul.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L68)*

###  parseBlockExtraData

• **parseBlockExtraData**: *[parseBlockExtraData](_istanbul_.md#parseblockextradata)*

*Defined in [istanbul.ts:67](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/istanbul.ts#L67)*
