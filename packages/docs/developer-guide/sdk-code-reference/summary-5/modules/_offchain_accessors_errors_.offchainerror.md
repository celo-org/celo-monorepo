# OffchainError

## Hierarchy

* RootError‹[OffchainError]()›

  ↳ **OffchainError**

## Implements

* BaseError‹[OffchainError]()›

## Index

### Constructors

* [constructor]()

### Properties

* [error]()
* [errorType]()
* [message]()
* [name]()
* [stack]()

## Constructors

### constructor

+ **new OffchainError**\(`error`: [OffchainErrors](_offchain_data_wrapper_.md#offchainerrors)\): [_OffchainError_]()

_Overrides void_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | [OffchainErrors](_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** [_OffchainError_]()

## Properties

### `Readonly` error

• **error**: [_OffchainErrors_](_offchain_data_wrapper_.md#offchainerrors)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L20)

### `Readonly` errorType

• **errorType**: [_OffchainError_]()

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

