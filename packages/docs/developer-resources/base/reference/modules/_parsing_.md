# Module: "parsing"

## Index

### Functions

* [parseSolidityStringArray](_parsing_.md#const-parsesoliditystringarray)
* [stringToBoolean](_parsing_.md#const-stringtoboolean)

## Functions

### `Const` parseSolidityStringArray

▸ **parseSolidityStringArray**(`stringLengths`: number[], `data`: string): *string[]*

*Defined in [packages/sdk/base/src/parsing.ts:17](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/parsing.ts#L17)*

Parses an "array of strings" that is returned from a Solidity function

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`stringLengths` | number[] | length of each string in bytes |
`data` | string | 0x-prefixed, hex-encoded string data in utf-8 bytes  |

**Returns:** *string[]*

___

### `Const` stringToBoolean

▸ **stringToBoolean**(`inputString`: string): *boolean*

*Defined in [packages/sdk/base/src/parsing.ts:1](https://github.com/medhak1/celo-monorepo/blob/master/packages/sdk/base/src/parsing.ts#L1)*

**Parameters:**

Name | Type |
------ | ------ |
`inputString` | string |

**Returns:** *boolean*
