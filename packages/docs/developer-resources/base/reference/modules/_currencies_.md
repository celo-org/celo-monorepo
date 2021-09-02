# Module: "currencies"

## Index

### Enumerations

* [CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)
* [SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)

### Functions

* [resolveCurrency](_currencies_.md#const-resolvecurrency)

### Object literals

* [CURRENCIES](_currencies_.md#const-currencies)
* [currencyToShortMap](_currencies_.md#const-currencytoshortmap)

## Functions

### `Const` resolveCurrency

▸ **resolveCurrency**(`label`: string): *[CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)*

*Defined in [packages/sdk/base/src/currencies.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |

**Returns:** *[CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)*

## Object literals

### `Const` CURRENCIES

### ▪ **CURRENCIES**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L14)*

▪ **[CURRENCY_ENUM.DOLLAR]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L20)*

* **code**: *string* = "cUSD"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "$"

▪ **[CURRENCY_ENUM.GOLD]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L15)*

* **code**: *string* = "cGLD"

* **displayDecimals**: *number* = 3

* **symbol**: *string* = ""

___

### `Const` currencyToShortMap

### ▪ **currencyToShortMap**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L43)*

###  [CURRENCY_ENUM.DOLLAR]

• **[CURRENCY_ENUM.DOLLAR]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.DOLLAR

*Defined in [packages/sdk/base/src/currencies.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L44)*

###  [CURRENCY_ENUM.GOLD]

• **[CURRENCY_ENUM.GOLD]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.GOLD

*Defined in [packages/sdk/base/src/currencies.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L45)*
