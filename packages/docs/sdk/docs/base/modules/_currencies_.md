[@celo/base](../README.md) › ["currencies"](_currencies_.md)

# Module: "currencies"

## Index

### Enumerations

* [CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)
* [SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)
* [StableToken](../enums/_currencies_.stabletoken.md)
* [Token](../enums/_currencies_.token.md)

### Type aliases

* [CeloTokenType](_currencies_.md#celotokentype)

### Functions

* [resolveCurrency](_currencies_.md#const-resolvecurrency)

### Object literals

* [CURRENCIES](_currencies_.md#const-currencies)
* [currencyToShortMap](_currencies_.md#const-currencytoshortmap)

## Type aliases

###  CeloTokenType

Ƭ **CeloTokenType**: *[StableToken](../enums/_currencies_.stabletoken.md) | [Token](../enums/_currencies_.token.md)*

*Defined in [packages/sdk/base/src/currencies.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L18)*

## Functions

### `Const` resolveCurrency

▸ **resolveCurrency**(`label`: string): *[CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)*

*Defined in [packages/sdk/base/src/currencies.ts:47](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L47)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |

**Returns:** *[CURRENCY_ENUM](../enums/_currencies_.currency_enum.md)*

## Object literals

### `Const` CURRENCIES

### ▪ **CURRENCIES**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L29)*

**`deprecated`** 

▪ **[CURRENCY_ENUM.DOLLAR]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L35)*

* **code**: *string* = "cUSD"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "$"

▪ **[CURRENCY_ENUM.EURO]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L40)*

* **code**: *string* = "cEUR"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "€"

▪ **[CURRENCY_ENUM.GOLD]**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L30)*

* **code**: *string* = "cGLD"

* **displayDecimals**: *number* = 3

* **symbol**: *string* = ""

___

### `Const` currencyToShortMap

### ▪ **currencyToShortMap**: *object*

*Defined in [packages/sdk/base/src/currencies.ts:68](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L68)*

**`deprecated`** use StableToken and Token

###  [CURRENCY_ENUM.DOLLAR]

• **[CURRENCY_ENUM.DOLLAR]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.DOLLAR

*Defined in [packages/sdk/base/src/currencies.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L69)*

###  [CURRENCY_ENUM.EURO]

• **[CURRENCY_ENUM.EURO]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.EURO

*Defined in [packages/sdk/base/src/currencies.ts:71](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L71)*

###  [CURRENCY_ENUM.GOLD]

• **[CURRENCY_ENUM.GOLD]**: *[SHORT_CURRENCIES](../enums/_currencies_.short_currencies.md)* = SHORT_CURRENCIES.GOLD

*Defined in [packages/sdk/base/src/currencies.ts:70](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/currencies.ts#L70)*
