[@celo/base](../README.md) › ["currencies"](_currencies_.md)

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

*Defined in [packages/sdk/base/src/currencies.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |

**Returns:** *[CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)*

## Object literals

### `Const` CURRENCIES

### ▪ **CURRENCIES**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L15)*

▪ **[CURRENCY_ENUM.DOLLAR]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L21)*

* **code**: *string* = "cUSD"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "$"

▪ **[CURRENCY_ENUM.EURO]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L26)*

* **code**: *string* = "cEUR"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "€"

▪ **[CURRENCY_ENUM.GOLD]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L16)*

* **code**: *string* = "cGLD"

* **displayDecimals**: *number* = 3

* **symbol**: *string* = ""

___

### `Const` currencyToShortMap

### ▪ **currencyToShortMap**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L52)*

###  [CURRENCY_ENUM.DOLLAR]

• **[CURRENCY_ENUM.DOLLAR]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.DOLLAR

*Defined in [packages/sdk/base/src/currencies.ts:53](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L53)*

###  [CURRENCY_ENUM.EURO]

• **[CURRENCY_ENUM.EURO]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.EURO

*Defined in [packages/sdk/base/src/currencies.ts:55](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L55)*

###  [CURRENCY_ENUM.GOLD]

• **[CURRENCY_ENUM.GOLD]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.GOLD

*Defined in [packages/sdk/base/src/currencies.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L54)*
