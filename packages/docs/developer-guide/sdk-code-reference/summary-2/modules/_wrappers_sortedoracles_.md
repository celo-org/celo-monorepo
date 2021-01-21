# wrappers/SortedOracles

## Index

### Enumerations

* [MedianRelation]()

### Classes

* [SortedOraclesWrapper]()

### Interfaces

* [MedianRate]()
* [OracleRate]()
* [OracleReport]()
* [OracleTimestamp]()
* [SortedOraclesConfig]()

### Type aliases

* [CurrencyPairIdentifier](_wrappers_sortedoracles_.md#currencypairidentifier)
* [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)

### Functions

* [pairIdentifier](_wrappers_sortedoracles_.md#const-pairidentifier)

### Object literals

* [OracleCurrencyPair](_wrappers_sortedoracles_.md#const-oraclecurrencypair)

## Type aliases

### CurrencyPairIdentifier

Ƭ **CurrencyPairIdentifier**: _Branded‹Address, "PairIdentifier"›_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:52_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L52)

### ReportTarget

Ƭ **ReportTarget**: [_CeloToken_](_base_.md#celotoken) _\|_ [_CurrencyPairIdentifier_](_wrappers_sortedoracles_.md#currencypairidentifier)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:82_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L82)

## Functions

### `Const` pairIdentifier

▸ **pairIdentifier**\(`pair`: string\): [_CurrencyPairIdentifier_](_wrappers_sortedoracles_.md#currencypairidentifier)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:61_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L61)

Used to construct the pair identifier from a pair label \(e.g. CELO/BTC\) The pair identifier needs to be a valid ethereum address, thus we truncate a keccak of the pair label. This function returns a branded type which can be fed into the wrapper.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `pair` | string | a string |

**Returns:** [_CurrencyPairIdentifier_](_wrappers_sortedoracles_.md#currencypairidentifier)

## Object literals

### `Const` OracleCurrencyPair

### ▪ **OracleCurrencyPair**: _object_

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:77_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L77)

### CELOBTC

• **CELOBTC**: _Branded‹string, "PairIdentifier"›_ = pairIdentifier\('CELO/BTC'\)

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L78)

### CELOUSD

• **CELOUSD**: [_StableToken_]() = CeloContract.StableToken

_Defined in_ [_contractkit/src/wrappers/SortedOracles.ts:79_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L79)

