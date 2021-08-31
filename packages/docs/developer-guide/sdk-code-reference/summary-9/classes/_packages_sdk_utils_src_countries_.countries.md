# Countries

## Hierarchy

* **Countries**

## Index

### Constructors

* [constructor](_packages_sdk_utils_src_countries_.countries.md#constructor)

### Properties

* [countryMap](_packages_sdk_utils_src_countries_.countries.md#countrymap)
* [language](_packages_sdk_utils_src_countries_.countries.md#language)
* [localizedCountries](_packages_sdk_utils_src_countries_.countries.md#localizedcountries)

### Methods

* [getCountry](_packages_sdk_utils_src_countries_.countries.md#getcountry)
* [getCountryByCodeAlpha2](_packages_sdk_utils_src_countries_.countries.md#getcountrybycodealpha2)
* [getFilteredCountries](_packages_sdk_utils_src_countries_.countries.md#getfilteredcountries)

## Constructors

### constructor

+ **new Countries**\(`language?`: undefined \| string\): [_Countries_](_packages_sdk_utils_src_countries_.countries.md)

_Defined in_ [_packages/sdk/utils/src/countries.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L39)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `language?` | undefined \| string |

**Returns:** [_Countries_](_packages_sdk_utils_src_countries_.countries.md)

## Properties

### countryMap

• **countryMap**: _Map‹string,_ [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)_›_

_Defined in_ [_packages/sdk/utils/src/countries.ts:38_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L38)

### language

• **language**: _string_

_Defined in_ [_packages/sdk/utils/src/countries.ts:37_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L37)

### localizedCountries

• **localizedCountries**: [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)_\[\]_

_Defined in_ [_packages/sdk/utils/src/countries.ts:39_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L39)

## Methods

### getCountry

▸ **getCountry**\(`countryName?`: string \| null\): [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) _\| undefined_

_Defined in_ [_packages/sdk/utils/src/countries.ts:49_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L49)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `countryName?` | string \| null |

**Returns:** [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) _\| undefined_

### getCountryByCodeAlpha2

▸ **getCountryByCodeAlpha2**\(`countryCode`: string\): [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) _\| undefined_

_Defined in_ [_packages/sdk/utils/src/countries.ts:59_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L59)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `countryCode` | string |

**Returns:** [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) _\| undefined_

### getFilteredCountries

▸ **getFilteredCountries**\(`query`: string\): [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)_\[\]_

_Defined in_ [_packages/sdk/utils/src/countries.ts:63_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L63)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `query` | string |

**Returns:** [_LocalizedCountry_](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)_\[\]_

