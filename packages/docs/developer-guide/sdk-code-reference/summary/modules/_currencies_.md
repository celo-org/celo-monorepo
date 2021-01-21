# currencies

## Index

### Enumerations

* [CURRENCY\_ENUM]()
* [SHORT\_CURRENCIES]()

### Functions

* [resolveCurrency](_currencies_.md#const-resolvecurrency)

### Object literals

* [CURRENCIES](_currencies_.md#const-currencies)
* [currencyToShortMap](_currencies_.md#const-currencytoshortmap)

## Functions

### `Const` resolveCurrency

▸ **resolveCurrency**\(`label`: string\): [_CURRENCY\_ENUM_]()

_Defined in_ [_packages/sdk/base/src/currencies.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L27)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `label` | string |

**Returns:** [_CURRENCY\_ENUM_]()

## Object literals

### `Const` CURRENCIES

### ▪ **CURRENCIES**: _object_

_Defined in_ [_packages/sdk/base/src/currencies.ts:14_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L14)

▪ **\[CURRENCY\_ENUM.DOLLAR\]**: _object_

_Defined in_ [_packages/sdk/base/src/currencies.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L20)

* **code**: _string_ = "cUSD"
* **displayDecimals**: _number_ = 2
* **symbol**: _string_ = "$"

▪ **\[CURRENCY\_ENUM.GOLD\]**: _object_

_Defined in_ [_packages/sdk/base/src/currencies.ts:15_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L15)

* **code**: _string_ = "cGLD"
* **displayDecimals**: _number_ = 3
* **symbol**: _string_ = ""

### `Const` currencyToShortMap

### ▪ **currencyToShortMap**: _object_

_Defined in_ [_packages/sdk/base/src/currencies.ts:43_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L43)

### \[CURRENCY\_ENUM.DOLLAR\]

• **\[CURRENCY\_ENUM.DOLLAR\]**: [_SHORT\_CURRENCIES_]() = SHORT\_CURRENCIES.DOLLAR

_Defined in_ [_packages/sdk/base/src/currencies.ts:44_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L44)

### \[CURRENCY\_ENUM.GOLD\]

• **\[CURRENCY\_ENUM.GOLD\]**: [_SHORT\_CURRENCIES_]() = SHORT\_CURRENCIES.GOLD

_Defined in_ [_packages/sdk/base/src/currencies.ts:45_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L45)

