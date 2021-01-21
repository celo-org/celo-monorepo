# UnavailableKey

## Hierarchy

* RootError‹[UnavailableKey]()›

  ↳ **UnavailableKey**

## Implements

* BaseError‹[UnavailableKey]()›

## Index

### Constructors

* [constructor]()

### Properties

* [account]()
* [errorType]()
* [message]()
* [name]()
* [stack]()

## Constructors

### constructor

+ **new UnavailableKey**\(`account`: Address\): [_UnavailableKey_]()

_Overrides void_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:31_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L31)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `account` | Address |

**Returns:** [_UnavailableKey_]()

## Properties

### `Readonly` account

• **account**: _Address_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:32_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L32)

### `Readonly` errorType

• **errorType**: [_UnavailableKey_]()

_Inherited from_ [_InvalidDataError_]()_._[_errorType_]()

Defined in packages/sdk/base/lib/result.d.ts:19

### message

• **message**: _string_

_Inherited from_ [_InvalidDataError_]()_._[_message_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:974

### name

• **name**: _string_

_Inherited from_ [_InvalidDataError_]()_._[_name_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:973

### `Optional` stack

• **stack**? : _undefined \| string_

_Inherited from_ [_InvalidDataError_]()_._[_stack_]()

Defined in node\_modules/typescript/lib/lib.es5.d.ts:975

