[@celo/phone-utils](../README.md) › [Globals](../globals.md) › ["countries"](../modules/_countries_.md) › [Countries](_countries_.countries.md)

# Class: Countries

## Hierarchy

* **Countries**

## Index

### Constructors

* [constructor](_countries_.countries.md#constructor)

### Properties

* [countryMap](_countries_.countries.md#countrymap)
* [language](_countries_.countries.md#language)
* [localizedCountries](_countries_.countries.md#localizedcountries)

### Methods

* [getCountry](_countries_.countries.md#getcountry)
* [getCountryByCodeAlpha2](_countries_.countries.md#getcountrybycodealpha2)
* [getFilteredCountries](_countries_.countries.md#getfilteredcountries)

## Constructors

###  constructor

\+ **new Countries**(`language?`: undefined | string): *[Countries](_countries_.countries.md)*

*Defined in [countries.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L40)*

**Parameters:**

Name | Type |
------ | ------ |
`language?` | undefined &#124; string |

**Returns:** *[Countries](_countries_.countries.md)*

## Properties

###  countryMap

• **countryMap**: *Map‹string, [LocalizedCountry](../interfaces/_countries_.localizedcountry.md)›*

*Defined in [countries.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L39)*

___

###  language

• **language**: *string*

*Defined in [countries.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L38)*

___

###  localizedCountries

• **localizedCountries**: *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md)[]*

*Defined in [countries.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L40)*

## Methods

###  getCountry

▸ **getCountry**(`countryName?`: string | null): *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md) | undefined*

*Defined in [countries.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L50)*

**Parameters:**

Name | Type |
------ | ------ |
`countryName?` | string &#124; null |

**Returns:** *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md) | undefined*

___

###  getCountryByCodeAlpha2

▸ **getCountryByCodeAlpha2**(`countryCode`: string): *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md) | undefined*

*Defined in [countries.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`countryCode` | string |

**Returns:** *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md) | undefined*

___

###  getFilteredCountries

▸ **getFilteredCountries**(`query`: string): *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md)[]*

*Defined in [countries.ts:64](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/phone-utils/src/countries.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`query` | string |

**Returns:** *[LocalizedCountry](../interfaces/_countries_.localizedcountry.md)[]*
