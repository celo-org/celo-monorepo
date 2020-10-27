# External module: "base/src/parsing"

## Index

### Functions

* [parseSolidityStringArray](_base_src_parsing_.md#const-parsesoliditystringarray)
* [stringToBoolean](_base_src_parsing_.md#const-stringtoboolean)

## Functions

### `Const` parseSolidityStringArray

▸ **parseSolidityStringArray**(`stringLengths`: number[], `data`: string): *string[]*

*Defined in [packages/base/src/parsing.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/parsing.ts#L17)*

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

*Defined in [packages/base/src/parsing.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/parsing.ts#L1)*

**Parameters:**

Name | Type |
------ | ------ |
`inputString` | string |

**Returns:** *boolean*
