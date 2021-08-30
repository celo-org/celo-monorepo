# parsing

## Index

### Functions

* [parseSolidityStringArray](_parsing_.md#const-parsesoliditystringarray)
* [stringToBoolean](_parsing_.md#const-stringtoboolean)

## Functions

### `Const` parseSolidityStringArray

▸ **parseSolidityStringArray**\(`stringLengths`: number\[\], `data`: string\): _string\[\]_

_Defined in_ [_packages/sdk/base/src/parsing.ts:17_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/parsing.ts#L17)

Parses an "array of strings" that is returned from a Solidity function

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `stringLengths` | number\[\] | length of each string in bytes |
| `data` | string | 0x-prefixed, hex-encoded string data in utf-8 bytes |

**Returns:** _string\[\]_

### `Const` stringToBoolean

▸ **stringToBoolean**\(`inputString`: string\): _boolean_

_Defined in_ [_packages/sdk/base/src/parsing.ts:1_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/parsing.ts#L1)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `inputString` | string |

**Returns:** _boolean_

