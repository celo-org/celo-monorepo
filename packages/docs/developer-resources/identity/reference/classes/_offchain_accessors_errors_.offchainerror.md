# Class: OffchainError

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

###  constructor

\+ **new OffchainError**(`error`: [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)): *[OffchainError](_offchain_accessors_errors_.offchainerror.md)*

*Overrides void*

*Defined in [packages/sdk/identity/src/offchain/accessors/errors.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** *[OffchainError](_offchain_accessors_errors_.offchainerror.md)*

## Properties

### `Readonly` error

• **error**: *[OffchainErrors](../modules/_offchain_data_wrapper_.md#offchainerrors)*

*Defined in [packages/sdk/identity/src/offchain/accessors/errors.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/offchain/accessors/errors.ts#L20)*

___

### `Readonly` errorType

• **errorType**: *[OffchainError](../enums/_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)*

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
