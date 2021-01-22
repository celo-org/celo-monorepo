# Module: "inputValidation"

## Index

### Enumerations

* [ValidatorKind](../enums/_inputvalidation_.validatorkind.md)

### Interfaces

* [BaseProps](../interfaces/_inputvalidation_.baseprops.md)

### Functions

* [validateDecimal](_inputvalidation_.md#validatedecimal)
* [validateInteger](_inputvalidation_.md#validateinteger)

## Functions

###  validateDecimal

▸ **validateDecimal**(`input`: string, `decimalSeparator`: string): *string*

*Defined in [packages/sdk/base/src/inputValidation.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/inputValidation.ts#L19)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | string | - |
`decimalSeparator` | string | "." |

**Returns:** *string*

___

###  validateInteger

▸ **validateInteger**(`input`: string): *string*

*Defined in [packages/sdk/base/src/inputValidation.ts:15](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/inputValidation.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | string |

**Returns:** *string*
