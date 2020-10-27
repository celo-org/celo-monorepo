# Class: OffchainError

## Hierarchy

* RootError‹[OffchainError](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)›

  ↳ **OffchainError**

## Implements

* BaseError‹[OffchainError](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)›

## Index

### Constructors

* [constructor](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#constructor)

### Properties

* [error](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#error)
* [errorType](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#errortype)
* [message](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#message)
* [name](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#name)
* [stack](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md#optional-stack)

## Constructors

###  constructor

\+ **new OffchainError**(`error`: [OffchainErrors](../modules/_contractkit_src_identity_offchain_data_wrapper_.md#offchainerrors)): *[OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)*

*Overrides void*

*Defined in [packages/contractkit/src/identity/offchain/accessors/errors.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [OffchainErrors](../modules/_contractkit_src_identity_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** *[OffchainError](_contractkit_src_identity_offchain_accessors_errors_.offchainerror.md)*

## Properties

###  error

• **error**: *[OffchainErrors](../modules/_contractkit_src_identity_offchain_data_wrapper_.md#offchainerrors)*

*Defined in [packages/contractkit/src/identity/offchain/accessors/errors.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/accessors/errors.ts#L20)*

___

###  errorType

• **errorType**: *[OffchainError](../enums/_contractkit_src_identity_offchain_accessors_errors_.schemaerrortypes.md#offchainerror)*

*Inherited from [InvalidDataError](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md).[errorType](_contractkit_src_identity_offchain_accessors_errors_.invaliddataerror.md#errortype)*

Defined in packages/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[message](_base_src_result_.rooterror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[name](_base_src_result_.rooterror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [RootError](_base_src_result_.rooterror.md).[stack](_base_src_result_.rooterror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975
