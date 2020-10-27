# External module: "base/src/currencies"

## Index

### Enumerations

* [CURRENCY_ENUM](../enums/_base_src_currencies_.currency_enum.md)
* [SHORT_CURRENCIES](../enums/_base_src_currencies_.short_currencies.md)

### Functions

* [resolveCurrency](_base_src_currencies_.md#const-resolvecurrency)

### Object literals

* [CURRENCIES](_base_src_currencies_.md#const-currencies)
* [currencyToShortMap](_base_src_currencies_.md#const-currencytoshortmap)
* [currencyTranslations](_base_src_currencies_.md#const-currencytranslations)

## Functions

### `Const` resolveCurrency

▸ **resolveCurrency**(`label`: string): *[CURRENCY_ENUM](../enums/_base_src_currencies_.currency_enum.md)*

*Defined in [packages/base/src/currencies.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L27)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |

**Returns:** *[CURRENCY_ENUM](../enums/_base_src_currencies_.currency_enum.md)*

## Object literals

### `Const` CURRENCIES

### ▪ **CURRENCIES**: *object*

*Defined in [packages/base/src/currencies.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L14)*

▪ **__computed**: *object*

*Defined in [packages/base/src/currencies.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L15)*

*Defined in [packages/base/src/currencies.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L20)*

* **code**: *string* = "cUSD"

* **displayDecimals**: *number* = 2

* **symbol**: *string* = "$"

___

### `Const` currencyToShortMap

### ▪ **currencyToShortMap**: *object*

*Defined in [packages/base/src/currencies.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L43)*

###  __computed

• **__computed**: *[SHORT_CURRENCIES](../enums/_base_src_currencies_.short_currencies.md)* = SHORT_CURRENCIES.GOLD

*Defined in [packages/base/src/currencies.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L44)*

*Defined in [packages/base/src/currencies.ts:45](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L45)*

___

### `Const` currencyTranslations

### ▪ **currencyTranslations**: *object*

*Defined in [packages/base/src/currencies.ts:62](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L62)*

###  en-US

• **en-US**: *object* = currencyTranslationsENUS

*Defined in [packages/base/src/currencies.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L63)*

#### Type declaration:

* \[ **key**: *string*\]: string

###  es-419

• **es-419**: *object* = currencyTranslationsESAR

*Defined in [packages/base/src/currencies.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/currencies.ts#L64)*

#### Type declaration:

* \[ **key**: *string*\]: string
