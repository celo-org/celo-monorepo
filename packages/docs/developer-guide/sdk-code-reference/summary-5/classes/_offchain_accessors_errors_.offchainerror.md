# OffchainError

## Hierarchy

* RootError‹[OffchainError](../enums/_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)›

  ↳ **OffchainError**

## Implements

* BaseError‹[OffchainError](../enums/_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)›

## Index

### Constructors

* [constructor](_offchain_accessors_errors_.offchainerror.md#constructor)

### Properties

* [error](_offchain_accessors_errors_.offchainerror.md#readonly-error)
* [errorType](_offchain_accessors_errors_.offchainerror.md#readonly-errortype)
* [message](_offchain_accessors_errors_.offchainerror.md#message)
* [name](_offchain_accessors_errors_.offchainerror.md#name)
* [stack](_offchain_accessors_errors_.offchainerror.md#optional-stack)

## Constructors

### constructor

+ **new OffchainError**\(`error`: [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)\): [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)

_Overrides void_

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:19_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L19)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `error` | [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** [_OffchainError_](_offchain_accessors_errors_.offchainerror.md)

## Properties

### `Readonly` error

• **error**: [_OffchainErrors_](../modules/_offchain_data_wrapper_.md#offchainerrors)

_Defined in_ [_packages/sdk/identity/src/offchain/accessors/errors.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L20)

### `Readonly` errorType

• **errorType**: [_OffchainError_](../enums/_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)

_Inherited from_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_._[_errorType_](_offchain_accessors_errors_.invaliddataerror.md#readonly-errortype)

Defined in packages/sdk/base/lib/result.d.ts:19

### message

• **message**: _string_

_Inherited from_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_._[_message_](_offchain_accessors_errors_.invaliddataerror.md#message)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:974

### name

• **name**: _string_

_Inherited from_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_._[_name_](_offchain_accessors_errors_.invaliddataerror.md#name)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:973

### `Optional` stack

• **stack**? : _undefined \| string_

_Inherited from_ [_InvalidDataError_](_offchain_accessors_errors_.invaliddataerror.md)_._[_stack_](_offchain_accessors_errors_.invaliddataerror.md#optional-stack)

Defined in node\_modules/typescript/lib/lib.es5.d.ts:975

