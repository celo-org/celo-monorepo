# Class: OffchainError

## Hierarchy

* RootError‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›

  ↳ **OffchainError**

## Implements

* BaseError‹[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)›

## Index

### Constructors

* [constructor](_identity_offchain_schema_utils_.offchainerror.md#constructor)

### Properties

* [error](_identity_offchain_schema_utils_.offchainerror.md#error)
* [errorType](_identity_offchain_schema_utils_.offchainerror.md#errortype)
* [message](_identity_offchain_schema_utils_.offchainerror.md#message)
* [name](_identity_offchain_schema_utils_.offchainerror.md#name)
* [stack](_identity_offchain_schema_utils_.offchainerror.md#optional-stack)

## Constructors

###  constructor

\+ **new OffchainError**(`error`: [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)): *[OffchainError](_identity_offchain_schema_utils_.offchainerror.md)*

*Overrides void*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:18](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`error` | [OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors) |

**Returns:** *[OffchainError](_identity_offchain_schema_utils_.offchainerror.md)*

## Properties

###  error

• **error**: *[OffchainErrors](../modules/_identity_offchain_data_wrapper_.md#offchainerrors)*

*Defined in [packages/contractkit/src/identity/offchain/schema-utils.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/offchain/schema-utils.ts#L19)*

___

###  errorType

• **errorType**: *[OffchainError](../enums/_identity_offchain_schema_utils_.schemaerrortypes.md#offchainerror)*

*Inherited from [InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md).[errorType](_identity_offchain_schema_utils_.invaliddataerror.md#errortype)*

Defined in packages/base/lib/result.d.ts:19

___

###  message

• **message**: *string*

*Inherited from [InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md).[message](_identity_offchain_schema_utils_.invaliddataerror.md#message)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:974

___

###  name

• **name**: *string*

*Inherited from [InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md).[name](_identity_offchain_schema_utils_.invaliddataerror.md#name)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:973

___

### `Optional` stack

• **stack**? : *undefined | string*

*Inherited from [InvalidDataError](_identity_offchain_schema_utils_.invaliddataerror.md).[stack](_identity_offchain_schema_utils_.invaliddataerror.md#optional-stack)*

Defined in node_modules/typedoc/node_modules/typescript/lib/lib.es5.d.ts:975
