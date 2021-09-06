# Class: Countries

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

###  constructor

\+ **new Countries**(`language?`: undefined | string): *[Countries](_packages_sdk_utils_src_countries_.countries.md)*

*Defined in [packages/sdk/utils/src/countries.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L39)*

**Parameters:**

Name | Type |
------ | ------ |
`language?` | undefined &#124; string |

**Returns:** *[Countries](_packages_sdk_utils_src_countries_.countries.md)*

## Properties

###  countryMap

• **countryMap**: *Map‹string, [LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)›*

*Defined in [packages/sdk/utils/src/countries.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L38)*

___

###  language

• **language**: *string*

*Defined in [packages/sdk/utils/src/countries.ts:37](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L37)*

___

###  localizedCountries

• **localizedCountries**: *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)[]*

*Defined in [packages/sdk/utils/src/countries.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L39)*

## Methods

###  getCountry

▸ **getCountry**(`countryName?`: string | null): *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) | undefined*

*Defined in [packages/sdk/utils/src/countries.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L49)*

**Parameters:**

Name | Type |
------ | ------ |
`countryName?` | string &#124; null |

**Returns:** *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) | undefined*

___

###  getCountryByCodeAlpha2

▸ **getCountryByCodeAlpha2**(`countryCode`: string): *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) | undefined*

*Defined in [packages/sdk/utils/src/countries.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`countryCode` | string |

**Returns:** *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md) | undefined*

___

###  getFilteredCountries

▸ **getFilteredCountries**(`query`: string): *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)[]*

*Defined in [packages/sdk/utils/src/countries.ts:63](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/countries.ts#L63)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |

**Returns:** *[LocalizedCountry](../interfaces/_packages_sdk_utils_src_countries_.localizedcountry.md)[]*
