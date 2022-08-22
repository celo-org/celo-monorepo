[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["versions"](../modules/_versions_.md) › [ContractVersion](_versions_.contractversion.md)

# Class: ContractVersion

**`internal`** 

## Hierarchy

* **ContractVersion**

## Index

### Constructors

* [constructor](_versions_.contractversion.md#constructor)

### Properties

* [major](_versions_.contractversion.md#readonly-major)
* [minor](_versions_.contractversion.md#readonly-minor)
* [patch](_versions_.contractversion.md#readonly-patch)
* [storage](_versions_.contractversion.md#readonly-storage)

### Methods

* [isAtLeast](_versions_.contractversion.md#isatleast)
* [toRaw](_versions_.contractversion.md#toraw)
* [toString](_versions_.contractversion.md#tostring)
* [fromRaw](_versions_.contractversion.md#static-fromraw)

## Constructors

###  constructor

\+ **new ContractVersion**(`storage`: number | string, `major`: number | string, `minor`: number | string, `patch`: number | string): *[ContractVersion](_versions_.contractversion.md)*

*Defined in [packages/sdk/contractkit/src/versions.ts:4](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`storage` | number &#124; string |
`major` | number &#124; string |
`minor` | number &#124; string |
`patch` | number &#124; string |

**Returns:** *[ContractVersion](_versions_.contractversion.md)*

## Properties

### `Readonly` major

• **major**: *number | string*

*Defined in [packages/sdk/contractkit/src/versions.ts:7](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L7)*

___

### `Readonly` minor

• **minor**: *number | string*

*Defined in [packages/sdk/contractkit/src/versions.ts:8](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L8)*

___

### `Readonly` patch

• **patch**: *number | string*

*Defined in [packages/sdk/contractkit/src/versions.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L9)*

___

### `Readonly` storage

• **storage**: *number | string*

*Defined in [packages/sdk/contractkit/src/versions.ts:6](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L6)*

## Methods

###  isAtLeast

▸ **isAtLeast**(`other`: [ContractVersion](_versions_.contractversion.md)): *any*

*Defined in [packages/sdk/contractkit/src/versions.ts:12](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [ContractVersion](_versions_.contractversion.md) |

**Returns:** *any*

___

###  toRaw

▸ **toRaw**(): *string | number[]*

*Defined in [packages/sdk/contractkit/src/versions.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L14)*

**Returns:** *string | number[]*

___

###  toString

▸ **toString**(): *string*

*Defined in [packages/sdk/contractkit/src/versions.ts:13](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L13)*

**Returns:** *string*

___

### `Static` fromRaw

▸ **fromRaw**(`raw`: ReturnType‹ContractVersion["toRaw"]›): *[ContractVersion](_versions_.contractversion.md)‹›*

*Defined in [packages/sdk/contractkit/src/versions.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/versions.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`raw` | ReturnType‹ContractVersion["toRaw"]› |

**Returns:** *[ContractVersion](_versions_.contractversion.md)‹›*
