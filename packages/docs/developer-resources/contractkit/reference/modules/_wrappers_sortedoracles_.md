# Module: "wrappers/SortedOracles"

## Index

### Enumerations

* [MedianRelation](../enums/_wrappers_sortedoracles_.medianrelation.md)

### Classes

* [SortedOraclesWrapper](../classes/_wrappers_sortedoracles_.sortedoracleswrapper.md)

### Interfaces

* [MedianRate](../interfaces/_wrappers_sortedoracles_.medianrate.md)
* [OracleRate](../interfaces/_wrappers_sortedoracles_.oraclerate.md)
* [OracleReport](../interfaces/_wrappers_sortedoracles_.oraclereport.md)
* [OracleTimestamp](../interfaces/_wrappers_sortedoracles_.oracletimestamp.md)
* [SortedOraclesConfig](../interfaces/_wrappers_sortedoracles_.sortedoraclesconfig.md)

### Type aliases

* [CurrencyPairIdentifier](_wrappers_sortedoracles_.md#currencypairidentifier)
* [ReportTarget](_wrappers_sortedoracles_.md#reporttarget)

### Functions

* [pairIdentifier](_wrappers_sortedoracles_.md#const-pairidentifier)

### Object literals

* [OracleCurrencyPair](_wrappers_sortedoracles_.md#const-oraclecurrencypair)

## Type aliases

###  CurrencyPairIdentifier

Ƭ **CurrencyPairIdentifier**: *Branded‹Address, "PairIdentifier"›*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L52)*

___

###  ReportTarget

Ƭ **ReportTarget**: *[CeloToken](_base_.md#celotoken) | [CurrencyPairIdentifier](_wrappers_sortedoracles_.md#currencypairidentifier)*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L82)*

## Functions

### `Const` pairIdentifier

▸ **pairIdentifier**(`pair`: string): *[CurrencyPairIdentifier](_wrappers_sortedoracles_.md#currencypairidentifier)*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:61](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L61)*

Used to construct the pair identifier from a pair label (e.g. CELO/BTC)
The pair identifier needs to be a valid ethereum address, thus we
truncate a keccak of the pair label.
This function returns a branded type which can be fed into the wrapper.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`pair` | string | a string  |

**Returns:** *[CurrencyPairIdentifier](_wrappers_sortedoracles_.md#currencypairidentifier)*

## Object literals

### `Const` OracleCurrencyPair

### ▪ **OracleCurrencyPair**: *object*

*Defined in [contractkit/src/wrappers/SortedOracles.ts:77](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L77)*

###  CELOBTC

• **CELOBTC**: *Branded‹string, "PairIdentifier"›* = pairIdentifier('CELO/BTC')

*Defined in [contractkit/src/wrappers/SortedOracles.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L78)*

###  CELOUSD

• **CELOUSD**: *[StableToken](../enums/_base_.celocontract.md#stabletoken)* = CeloContract.StableToken

*Defined in [contractkit/src/wrappers/SortedOracles.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/wrappers/SortedOracles.ts#L79)*
