# Class: UnavailableKey

## Hierarchy

* RootError‹[UnavailableKey](../enums/_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

  ↳ **UnavailableKey**

## Implements

* BaseError‹[UnavailableKey](../enums/_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)›

## Index

### Constructors

* [constructor](_offchain_accessors_errors_.unavailablekey.md#constructor)

### Properties

* [account](_offchain_accessors_errors_.unavailablekey.md#readonly-account)
* [errorType](_offchain_accessors_errors_.unavailablekey.md#readonly-errortype)
* [message](_offchain_accessors_errors_.unavailablekey.md#message)
* [name](_offchain_accessors_errors_.unavailablekey.md#name)
* [stack](_offchain_accessors_errors_.unavailablekey.md#optional-stack)

## Constructors

###  constructor

\+ **new UnavailableKey**(`account`: Address): *[UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/offchain/accessors/errors.ts:31](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`account` | Address |

**Returns:** *[UnavailableKey](_offchain_accessors_errors_.unavailablekey.md)*

## Properties

### `Readonly` account

• **account**: *Address*

*Defined in [packages/sdk/identity/src/offchain/accessors/errors.ts:32](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L32)*

___

### `Readonly` errorType

• **errorType**: *[UnavailableKey](../enums/_offchain_accessors_errors_.schemaerrortypes.md#unavailablekey)*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[errorType](_offchain_accessors_errors_.invaliddataerror.md#readonly-errortype)*

Defined in packages/sdk/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[message](_offchain_accessors_errors_.invaliddataerror.md#message)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[name](_offchain_accessors_errors_.invaliddataerror.md#name)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [InvalidDataError](_offchain_accessors_errors_.invaliddataerror.md).[stack](_offchain_accessors_errors_.invaliddataerror.md#optional-stack)*

Defined in node_modules/typescript/lib/lib.es5.d.ts:975
